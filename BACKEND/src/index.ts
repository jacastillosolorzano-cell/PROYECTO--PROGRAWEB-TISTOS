// ===============================================================
//                   STREAM + CHAT + NIVELES + REGALOS
// ===============================================================

import express from "express";
import type { Request, Response, NextFunction } from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import { prisma } from "./prisma/client.js";

import regalosRouter from "./routes/regalos.routes.js";
import usuariosRouter from "./routes/usuarios.routes.js";
import ruletaRouter from "./routes/ruleta.routes.js";
import streamsRouter from "./routes/streams.routes.js";
import chatRouter from "./routes/chat.routes.js"; // si usas HISTORIAL offline
import authRouter, { loginHandler, logoutHandler } from "./routes/auth.routes.js";
import streamersRouter from "./routes/streamers.route.js";
import monedasRouter from "./routes/monedas.routes.js";
import nivelesRouter from "./routes/niveles.routes.js";
import nivelStreamerRouter from "./routes/nivelStreamer.routes.js";
import notificacionesRouter from "./routes/notificaciones.routes.js";
import recargasRouter from "./routes/recargas.routes.js";
import streamerPerfilRouter from "./routes/streamerPerfil.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import { recalcularNivelEspectador } from "./utils/niveles.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5002;

// ===============================================================
//                      EXPRESS + ROUTERS
// ===============================================================
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas HTTP
app.use("/usuarios", usuariosRouter);
app.use("/regalos", regalosRouter);
app.use("/ruleta", ruletaRouter);
app.use("/streams", streamsRouter);
app.use("/sesiones", chatRouter); // historial, no suma puntos aquí
app.use("/streamers", streamersRouter);
app.use("/auth", authRouter);
app.use("/monedas", monedasRouter);
app.use("/niveles", nivelesRouter);
// Rutas para actualizar niveles de streamer (horas requeridas por nivel)
app.use("/niveles", nivelStreamerRouter);
app.use("/notificaciones", notificacionesRouter);
app.use("/recargas", recargasRouter);
app.use("/streamers", streamerPerfilRouter);
app.use("/chats", chatRoutes); 
app.post("/login", loginHandler);
app.post("/logout", logoutHandler);

// ===============================================================
//                HTTP + SOCKET SERVER
// ===============================================================
const server = http.createServer(app);

const io = new IOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Hacer disponible el servidor de sockets en toda la app para poder emitir
app.locals.io = io;

// ===============================================================
//                  MEMORIA DE CONEXIÓN DE STREAMS
// ===============================================================
type StreamRoom = {
  streamer: string | null;
  viewers: string[];
};

const streams: Record<string, StreamRoom> = {};

// Mapeo de usuarios a sockets para notificaciones personalizadas
const userSockets: Record<string, string> = {};

// Hacer el mapeo disponible en toda la app para rutas HTTP
// De este modo, las rutas pueden emitir eventos al socket del usuario correcto
app.locals.userSockets = userSockets;

// ===============================================================
//                      SOCKET CONNECTION
// ===============================================================
io.on("connection", (socket) => {
  console.log("🔌 Socket conectado:", socket.id);

  // =============================================================
  //      STREAMER ROOM — registrar socket para notificaciones
  // =============================================================
  // El frontend del estudio emite "join_streamer_room" con el id del streamer
  // para que el backend sepa a qué socket enviar las notificaciones (nivel, regalos).
  socket.on("join_streamer_room", (id_streamer: string) => {
    if (id_streamer) {
      userSockets[id_streamer] = socket.id;
      console.log(
        `📺 Streamer ${id_streamer} conectado al room personal con socket ${socket.id}`
      );
    }
  });

  // =============================================================
  //             JOIN STREAM (VIDEO)
  // =============================================================
  socket.on("join_stream", ({ streamId, role }) => {
    if (!streamId) return;

    const roomName = `stream_${streamId}`;
    socket.join(roomName);

    if (!streams[streamId]) {
      streams[streamId] = { streamer: null, viewers: [] };
    }

    if (role === "streamer") {
      streams[streamId].streamer = socket.id;
      console.log("🎥 Streamer conectado:", socket.id);
    } else {
      if (!streams[streamId].viewers.includes(socket.id)) {
        streams[streamId].viewers.push(socket.id);
      }

      console.log("👤 Viewer conectado:", socket.id);

      if (streams[streamId].streamer) {
        io.to(streams[streamId].streamer!).emit("viewer-joined", socket.id);
      }
    }
  });

  // =============================================================
  //                  JOIN CHAT
  // =============================================================
  socket.on("chat:join", async ({ streamId, userId, nombre }) => {
    if (!streamId || !userId) return;

    const roomName = `stream_${streamId}`;
    socket.join(roomName);

    console.log(`💬 ${nombre} (${userId}) se unió al chat ${streamId}`);

    // Determinar el nivel actual del espectador para este streamer
    let nivelOrden = 1;
    let nivelNombre: string | null = null;
    try {
      const sesion = await prisma.sesionStreaming.findUnique({
        where: { id_sesion: streamId },
        select: { id_streamer: true },
      });
      if (sesion) {
        const progreso = await prisma.progresoEspectador.findFirst({
          where: { id_espectador: userId, id_streamer: sesion.id_streamer },
          include: { nivel: true },
        });
        if (progreso) {
          nivelOrden = progreso.nivel?.orden ?? 1;
          nivelNombre = progreso.nivel?.nombre_nivel ?? null;
        }
      }
    } catch (err) {
      console.error("Error al obtener nivel en chat:join", err);
    }

    io.to(roomName).emit("chat:user-joined", {
      streamId,
      userId,
      nombre,
      nivelOrden,
      nivelNombre,
      timestamp: new Date().toISOString(),
    });

    // Registrar el socket para este usuario
    if (userId) {
      userSockets[userId] = socket.id;
    }
  });

  // =============================================================
  //       CHAT MESSAGE — HU1 + HU2 + HU3 (correcto)
  // =============================================================
  socket.on("chat:message", async ({ streamId, userId, nombre, text }) => {
    if (!streamId || !userId || !text?.trim()) return;

    const cleanText = text.trim();
    const roomName = `stream_${streamId}`;

    // 1) Obtener sesión para saber id_streamer
    const sesion = await prisma.sesionStreaming.findUnique({
      where: { id_sesion: streamId },
    });
    if (!sesion) return;

    const id_streamer = sesion.id_streamer;

    // 2) Leer progreso antes
    const progresoAntes = await prisma.progresoEspectador.findFirst({
      where: { id_espectador: userId, id_streamer },
      include: { nivel: true },
    });
    const nivelOrdenAntes = progresoAntes?.nivel?.orden ?? 0;

    // 3) Sumar 1 punto por mensaje
    await prisma.progresoEspectador.updateMany({
      where: { id_espectador: userId, id_streamer },
      data: { puntos_actuales: { increment: 1 } },
    });

    // 4) Recalcular nivel (puede generar notificación)
    await recalcularNivelEspectador(userId, id_streamer);

    // 5) Leer progreso después
    const progresoDespues = await prisma.progresoEspectador.findFirst({
      where: { id_espectador: userId, id_streamer },
      include: { nivel: true },
    });

    const nivelOrden = progresoDespues?.nivel?.orden ?? 1;
    const nivelNombre = progresoDespues?.nivel?.nombre_nivel ?? "Lvl 1";

    // 6) Emitir mensaje enriquecido — HU2
    io.to(roomName).emit("chat:message", {
      streamId,
      userId,
      nombre,
      text: cleanText,
      nivelOrden,
      nivelNombre,
      timestamp: new Date().toISOString(),
    });

    // 7) Emitir level up SOLO si subió — HU3
    if (nivelOrden > nivelOrdenAntes) {
      socket.emit("level:up", {
        nivel: nivelNombre,
        orden: nivelOrden,
      });
    }
  });

  // =============================================================
  //             REGALOS EN TIEMPO REAL — HU4
  // =============================================================
  socket.on("gift:send", ({ streamId, userId, nombre, regalo, puntos }) => {
    const roomName = `stream_${streamId}`;
    io.to(roomName).emit("gift:received", {
      usuario: nombre,
      regalo,
      puntos,
      timestamp: new Date().toISOString(),
    });
  });

  // =============================================================
  //             WebRTC (video)
  // =============================================================
  socket.on("stream-offer", (data) => {
    io.to(data.to).emit("stream-offer", data);
  });

  socket.on("stream-answer", (data) => {
    io.to(data.to).emit("stream-answer", data);
  });

  socket.on("ice-candidate", (data) => {
    io.to(data.to).emit("ice-candidate", data);
  });

  // =============================================================
  //          LIMPIEZA AL DESCONECTAR
  // =============================================================
  socket.on("disconnect", () => {
    console.log("❌ Socket desconectado:", socket.id);

    for (const streamId in streams) {
      const s = streams[streamId];

      if (s.streamer === socket.id) {
        io.to(`stream_${streamId}`).emit("stream-ended");
        delete streams[streamId];
        continue;
      }

      s.viewers = s.viewers.filter((v) => v !== socket.id);
    }

    // Eliminar socket de mapeo de usuarios
    for (const uid in userSockets) {
      if (userSockets[uid] === socket.id) {
        delete userSockets[uid];
        break;
      }
    }
  });
});

// ===============================================================
//                     INICIAR SERVIDOR
// ===============================================================
server.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});
