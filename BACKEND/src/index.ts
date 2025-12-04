import express from "express";
import type { Request, Response, NextFunction } from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import { prisma, PrismaClientKnownRequestError } from "./prisma/client.js";
import { v4 as uuidv4 } from "uuid";
import regalosRouter from "./routes/regalos.routes.js";
import { normalizeStreamerId } from "./utils/normalizeStreamerId.js";
import usuariosRouter from "./routes/usuarios.routes.js";
import ruletaRouter from "./routes/ruleta.routes.js";
import streamsRouter from "./routes/streams.routes.js";
import chatRouter from "./routes/chat.routes.js";
import authRouter, { loginHandler, logoutHandler } from "./routes/auth.routes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5003;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/usuarios", usuariosRouter);
app.use("/usuarios", usuariosRouter);
app.use("/regalos", regalosRouter);
app.use("/ruleta", ruletaRouter);
app.use("/streams", streamsRouter);
app.use("/sesiones", chatRouter);
app.use("/auth", authRouter);
app.post("/login", loginHandler);
app.post("/logout", logoutHandler);

// Healthcheck para la nube
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Middleware global de errores (último antes de listen)
app.use(
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error no manejado:", err);

    // Errores de Prisma conocidos (validación, unique, etc.)
    if (err?.code && typeof err.code === "string") {
      return res.status(400).json({ error: "Error en base de datos" });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
);


app.use((err: any, req: Request, resp: Response, next: NextFunction) => {
  if (err && err instanceof SyntaxError && "body" in err) {
    console.warn("JSON inválido en la petición");
    return resp.status(400).json({ error: "JSON inválido" });
  }
  next(err);
});

const server = http.createServer(app);

const io = new IOServer(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true
    }
});


// Guarda los viewers y streamer por streamId
// Guarda los viewers y streamer por streamId
const streams: Record<string, { streamer: string | null; viewers: string[] }> = {};

io.on("connection", (socket) => {
    console.log("Socket conectado:", socket.id);

    // ===========================
    //  JOIN STREAM
    // ===========================
    socket.on("join_stream", ({ streamId, role }) => {

        // El socket entra al room del stream
        socket.join(`stream_${streamId}`);

        if (!streams[streamId]) {
            streams[streamId] = {
                streamer: null,
                viewers: []
            };
        }

        if (role === "streamer") {
            // Registrar streamer
            streams[streamId].streamer = socket.id;
            console.log("🎥 Streamer conectado:", socket.id);
        } else {
            // Registrar viewer
            if (!streams[streamId].viewers.includes(socket.id)) {
                streams[streamId].viewers.push(socket.id);
            }

            console.log("👤 Viewer conectado:", socket.id);

            // Avisar al streamer que hay un viewer nuevo
            if (streams[streamId].streamer) {
                io.to(streams[streamId].streamer!).emit("viewer-joined", socket.id);
            }
        }
    });


    // ===========================
    //  WebRTC: OFFER
    // ===========================
    socket.on("stream-offer", (data) => {
        io.to(data.to).emit("stream-offer", {
            offer: data.offer,
            from: data.from,
            to: data.to,
            streamId: data.streamId
        });
    });

    // ===========================
    //  WebRTC: ANSWER
    // ===========================
    socket.on("stream-answer", (data) => {
        io.to(data.to).emit("stream-answer", {
            answer: data.answer,
            from: data.from,
            to: data.to
        });
    });

    // ===========================
    //  WebRTC: ICE CANDIDATES
    // ===========================
    socket.on("ice-candidate", (data) => {
        io.to(data.to).emit("ice-candidate", {
            candidate: data.candidate,
            from: data.from,
            to: data.to
        });
    });
    // ===========================
    //  LIMPIEZA AL DESCONECTAR
    // ===========================
    socket.on("disconnect", () => {
        console.log("❌ Socket desconectado:", socket.id);

        for (const streamId in streams) {
            const s = streams[streamId];

            // Si el STREAMER se desconecta → cerrar stream
            if (s.streamer === socket.id) {
                console.log("⚠️ Streamer desconectado, cerrando stream:", streamId);

                // 🔥 ENVIAR EVENTO A TODOS LOS VIEWERS
                io.to(`stream_${streamId}`).emit("stream-ended");

                delete streams[streamId];
                continue;
            }

            // Si es viewer → removerlo
            s.viewers = s.viewers.filter(v => v !== socket.id);
        }
    });


    socket.on("viewer-left", ({ streamId, viewerId }) => {
        if (streams[streamId]) {
            streams[streamId].viewers = streams[streamId].viewers.filter(v => v !== viewerId);
            console.log("👤 Viewer removido:", viewerId);
        }
    });

});

server.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
});
