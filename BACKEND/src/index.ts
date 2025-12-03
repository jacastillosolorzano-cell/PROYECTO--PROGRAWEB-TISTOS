import express from "express";
import type { Request, Response } from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import { PrismaClient } from "./generated/prisma";
import { PrismaClientKnownRequestError } from "./generated/prisma/runtime/library";
import { v4 as uuidv4 } from "uuid";

dotenv.config();
const app = express();
const PORT = process.env.PORT;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10");
const prisma = new PrismaClient();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// =========================
//  SOCKET.IO CONFIG
// =========================
const server = http.createServer(app);
const io = new IOServer(server, {
    cors: { origin: process.env.FRONTEND_URL || "http://localhost:5173" }

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


// =================================================================
//                          USUARIOS
// =================================================================
app.post("/usuarios/crear", async (req: Request, resp: Response) => {
    try {
        const data = req.body;

        if (!data.nombre || !data.email || !data.contra) {
            return resp.status(400).json({ error: "Nombre, email y contraseña son requeridos" });
        }

        const contrasena_hash = await bcrypt.hash(data.contra, BCRYPT_ROUNDS);

        const usuario = await prisma.usuario.create({
            data: {
                nombre: data.nombre,
                email: data.email,
                contrasena_hash,
                rol: data.rol || "ESPECTADOR",
                fecha_registro: new Date(),
                estado: "ACTIVO"
            }
        });

        const { contrasena_hash: _, ...usuarioSeguro } = usuario;
        resp.status(200).json(usuarioSeguro);

    } catch (error) {
        const prismaError = error as PrismaClientKnownRequestError;

        if (prismaError.code === "P2002") {
            resp.status(400).json({ error: "El email ya está registrado" });
        } else {
            resp.status(500).json({ error: "Error al crear usuario" });
        }
    }
});


// =================================================================
//                           LOGIN
// =================================================================
app.post("/login", async (req: Request, resp: Response) => {
    try {
        const { correo, contrasena } = req.body;

        if (!correo || !contrasena) {
            return resp.status(400).json({ error: "Correo y contraseña son requeridos" });
        }

        const usuario = await prisma.usuario.findFirst({
            where: { email: correo }
        });

        if (!usuario) {
            return resp.status(401).json({ error: "Credenciales inválidas" });
        }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);

        if (!contrasenaValida) {
            return resp.status(401).json({ error: "Credenciales inválidas" });
        }

        const { contrasena_hash: _, ...usuarioSeguro } = usuario;
        resp.status(200).json(usuarioSeguro);

    } catch (error) {
        console.error(error);
        resp.status(500).json({ error: "Error al iniciar sesión" });
    }
});

// =================================================================
//                 PERFIL ESPECTADOR - INICIALIZAR
// =================================================================
app.post("/usuarios/:id_usuario/inicializar-perfil", async (req: Request, resp: Response) => {
    try {
        const { id_usuario } = req.params;

        const usuario = await prisma.usuario.findUnique({ where: { id_usuario } });
        if (!usuario) return resp.status(404).json({ error: "Usuario no encontrado" });

        let perfil = await prisma.perfilEspectador.findUnique({ where: { id_usuario } });

        if (!perfil) {
            perfil = await prisma.perfilEspectador.create({
                data: {
                    id_usuario,
                    saldo_monedas: 0
                }
            });
        }

        resp.status(200).json({ message: "Perfil listo", perfil });

    } catch (error) {
        resp.status(500).json({ error: "Error al inicializar perfil" });
    }
});

// =================================================================
//                        STREAMING
// =================================================================


app.post("/streams/crear", async (req: Request, resp: Response) => {
    try {
        const { id_streamer, titulo } = req.body;

        if (!id_streamer || !titulo) {
            return resp.status(400).json({ error: "id_streamer y titulo son requeridos" });
        }

        const streamId = uuidv4();

        await prisma.sesionStreaming.create({
            data: {
                id_sesion: streamId,
                id_streamer,
                titulo,
                fecha_inicio: new Date()
            }
        });


        const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/#/viewer/${streamId}`;

        resp.status(200).json({ streamId, link });

    } catch (error) {
        console.error("Error al crear stream:", error);
        resp.status(500).json({ error: "Error al crear stream" });
    }
});


app.post("/streams/:id_sesion/finalizar", async (req: Request, resp: Response) => {
    try {
        const { id_sesion } = req.params;

        const sesion = await prisma.sesionStreaming.findUnique({ where: { id_sesion } });
        if (!sesion) return resp.status(404).json({ error: "Sesión no encontrada" });

        const fecha_fin = new Date();
        const duracion = Math.floor((fecha_fin.getTime() - sesion.fecha_inicio.getTime()) / 60000);

        const actualizada = await prisma.sesionStreaming.update({
            where: { id_sesion },
            data: {
                fecha_fin,
                duracion_minutos: duracion
            }
        });

        resp.status(200).json({ message: "Sesión finalizada", sesion: actualizada });

    } catch (error) {
        resp.status(500).json({ error: "Error al finalizar sesión" });
    }
});

// =================================================================
//                   CHAT + PUNTOS POR MENSAJE
// =================================================================
app.post("/sesiones/:id_sesion/mensajes", async (req: Request, resp: Response) => {
    try {
        const { id_sesion } = req.params;
        const { id_espectador, contenido } = req.body;

        if (!id_sesion || !id_espectador || !contenido) {
            return resp.status(400).json({ error: "Datos incompletos" });
        }

        const sesion = await prisma.sesionStreaming.findUnique({
            where: { id_sesion }
        });

        if (!sesion) {
            return resp.status(404).json({ error: "Sesión no encontrada" });
        }

        const mensaje = await prisma.mensajeChat.create({
            data: {
                id_sesion,
                id_espectador,
                contenido,
                puntos_otorgados: 1
            }
        });

        resp.status(200).json({ mensaje });

    } catch (error) {
        resp.status(500).json({ error: "Error en chat" });
    }
});

// =================================================================
//                    INICIAR SERVIDOR
// =================================================================
server.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
});
