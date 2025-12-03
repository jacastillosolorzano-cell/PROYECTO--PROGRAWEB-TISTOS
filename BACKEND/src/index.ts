import express from "express";
import type { Request, Response } from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import { PrismaClient } from "./generated/prisma/index.js";
import { PrismaClientKnownRequestError } from "./generated/prisma/runtime/library.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Normaliza el id del streamer (puedes ajustar la lógica según tus necesidades)
function normalizeStreamerId(id: any): string {
    if (typeof id === "string") return id;
    if (id && typeof id === "object" && id.id_streamer) return id.id_streamer;
    return String(id);
}


dotenv.config();
const app = express();
const PORT = process.env.PORT;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10");
const prisma = new PrismaClient();
app.use(cors());


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Capturar errores de parseo JSON (body-parser) y devolver respuesta JSON genérica
// Evita que body-parser devuelva HTML con stack traces al cliente
app.use((err: any, req: Request, resp: Response, next: any) => {
    if (err && err instanceof SyntaxError && 'body' in err) {
        console.warn('JSON inválido en la petición');
        return resp.status(400).json({ error: 'JSON inválido' });
    }
    next(err);
});

// =========================
//  SOCKET.IO CONFIG
// =========================
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
})

app.post("/regalos/crear", async (req: Request, resp: Response) => {
    try {
        const data = req.body

        // Aceptar nombres de campos antiguos y nuevos: { costo, puntos } o { costo_monedas, puntos_otorgados }
        const nombre = data.nombre
        const costo = data.costo_monedas ?? data.costo
        const puntos = data.puntos_otorgados ?? data.puntos
        const id_streamer = data.id_streamer

        const id_streamer_str = normalizeStreamerId(id_streamer)

        if (!nombre || !costo || !puntos || !id_streamer_str) {
            resp.status(400).json({ error: "Nombre, costo, puntos e id_streamer son requeridos" })
            return
        }

        // Verificar que el streamer exista para evitar violación de FK
        const streamerExists = await prisma.usuario.findUnique({ where: { id_usuario: id_streamer_str } });
        if (!streamerExists) {
            resp.status(400).json({ error: "El id_streamer no existe" });
            return
        }

        const regalo = await prisma.regalo.create({
            data: {
                nombre,
                costo_monedas: Number(costo),
                puntos_otorgados: Number(puntos),
                id_streamer: id_streamer_str,
                activo: true
            }
        })

        resp.status(200).json(regalo)
    } catch (error) {
        const prismaError = error as PrismaClientKnownRequestError
        // Registrar detalle de error en archivo temporal para diagnóstico local
        try {
            const dump = {
                time: new Date().toISOString(),
                path: '/regalos/crear',
                message: (error as any)?.message || String(error),
                stack: (error as any)?.stack || null
            }
            fs.appendFileSync('error_debug.log', JSON.stringify(dump) + "\n")
        } catch (e) {
            // no-op
        }
        console.error('Error en /regalos/crear:', (error as any)?.message || error);
        resp.status(500).json({ error: "Error al crear el regalo" })
    }
})

app.get("/regalos/streamer/:id_streamer", async (req: Request, resp: Response) => {
    try {
        const { id_streamer } = req.params

        if (!id_streamer) {
            resp.status(400).json({ error: "id_streamer es requerido" })
            return
        }

        const regalos = await prisma.regalo.findMany({
            where: { id_streamer }
        })

        resp.status(200).json(regalos)
    } catch (error) {
        resp.status(500).json({ error: "Error al obtener regalos" })
    }
})

app.put("/regalos/:id_regalo", async (req: Request, resp: Response) => {
    try {
        const { id_regalo } = req.params
        const data = req.body

        if (!id_regalo) {
            resp.status(400).json({ error: "id_regalo es requerido" })
            return
        }

        const actualizaciones: any = {}

        if (data.nombre) actualizaciones.nombre = data.nombre
        // Aceptar ambos nombres de campo para compatibilidad
        if (data.costo_monedas !== undefined) actualizaciones.costo_monedas = Number(data.costo_monedas)
        if (data.costo !== undefined) actualizaciones.costo_monedas = Number(data.costo)
        if (data.puntos_otorgados !== undefined) actualizaciones.puntos_otorgados = Number(data.puntos_otorgados)
        if (data.puntos !== undefined) actualizaciones.puntos_otorgados = Number(data.puntos)
        if (data.activo !== undefined) actualizaciones.activo = data.activo

        const regalo = await prisma.regalo.update({
            where: { id_regalo },
            data: actualizaciones
        })

        resp.status(200).json(regalo)
    } catch (error) {
        const prismaError = error as PrismaClientKnownRequestError
        if (prismaError.code === "P2025") {
            resp.status(404).json({ error: "Regalo no encontrado" })
        } else {
            resp.status(500).json({ error: "Error al actualizar el regalo" })
        }
    }
})

app.delete("/regalos/:id_regalo", async (req: Request, resp: Response) => {
    try {
        const { id_regalo } = req.params

        if (!id_regalo) {
            resp.status(400).json({ error: "id_regalo es requerido" })
            return
        }

        await prisma.regalo.delete({
            where: { id_regalo }
        })

        resp.status(200).json({ message: "Regalo eliminado exitosamente" })
    } catch (error) {
        const prismaError = error as PrismaClientKnownRequestError
        if (prismaError.code === "P2025") {
            resp.status(404).json({ error: "Regalo no encontrado" })
        } else {
            resp.status(500).json({ error: "Error al eliminar el regalo" })
        }
    }
})

// ============== RULETA ==============
app.post("/ruleta/jugar", async (req: Request, resp: Response) => {
    try {
        const { id_espectador, puntos_apostados, id_streamer } = req.body
        const id_streamer_str = normalizeStreamerId(id_streamer)

        if (!id_espectador || !puntos_apostados) {
            resp.status(400).json({ error: "id_espectador y puntos_apostados son requeridos" })
            return
        }

        // Verificar que el usuario existe
        const usuario = await prisma.usuario.findUnique({
            where: { id_usuario: id_espectador },
            include: { perfilEspectador: true }
        })

        if (!usuario) {
            resp.status(404).json({ error: "Usuario no encontrado" })
            return
        }

        // Si no tiene perfil de espectador, crear uno
        let perfilEspectador = usuario.perfilEspectador
        if (!perfilEspectador) {
            perfilEspectador = await prisma.perfilEspectador.create({
                data: {
                    id_usuario: id_espectador,
                    saldo_monedas: 0
                }
            })
        }

        // Obtener o crear el progreso del espectador (para los puntos)
        let progreso = await prisma.progresoEspectador.findFirst({
            where: {
                id_espectador
            }
        })

        // Si no tiene progreso, no podemos jugar sin tener un nivel asignado
        if (!progreso) {
            // Crear un progreso temporal sin nivel (esto requiere crear primero un nivel)
            // Por ahora, retornar error
            resp.status(400).json({
                error: "No tienes puntos asignados. Contacta a un administrador para asignarte puntos.",
                puntos_disponibles: 0
            })
            return
        }

        // Verificar que tiene suficientes puntos
        if (progreso.puntos_actuales < puntos_apostados) {
            resp.status(400).json({
                error: "No tienes suficientes puntos",
                puntos_disponibles: progreso.puntos_actuales,
                puntos_requeridos: puntos_apostados
            })
            return
        }

        // Definir los sectores de la ruleta
        const sectores = [
            { label: "+5", monedas: 5 },
            { label: "+10", monedas: 10 },
            { label: "+20", monedas: 20 },
            { label: "+50", monedas: 50 },
            { label: "+100", monedas: 100 },
            { label: "x2", monedas: 50 } // especial: x2 = 50 monedas
        ]

        // Elegir un sector aleatorio
        const indiceAleatorio = Math.floor(Math.random() * sectores.length)
        const sectorAleatorio = sectores[indiceAleatorio]

        if (!sectorAleatorio) {
            resp.status(500).json({ error: "Error al seleccionar sector de ruleta" })
            return
        }

        const monedas_ganadas = sectorAleatorio.monedas

        // Registrar la jugada en la base de datos
        const jugada = await prisma.jugadaRuleta.create({
            data: {
                id_espectador,
                id_streamer: id_streamer_str,
                puntos_apostados,
                resultado_segmento: sectorAleatorio.label,
                monedas_ganadas,
                puntos_convertidos: 0
            }
        })

        // Actualizar el saldo de monedas del usuario (SUMAR)
        await prisma.perfilEspectador.update({
            where: { id_usuario: id_espectador },
            data: { saldo_monedas: { increment: monedas_ganadas } }
        })

        // Actualizar los puntos del usuario (RESTAR)
        // Usar el id_progreso directamente
        await prisma.progresoEspectador.update({
            where: { id_progreso: progreso.id_progreso },
            data: { puntos_actuales: { decrement: puntos_apostados } }
        })

        // Obtener los datos actualizados
        const perfilActualizado = await prisma.perfilEspectador.findUnique({
            where: { id_usuario: id_espectador }
        })

        const progresoActualizado = await prisma.progresoEspectador.findFirst({
            where: {
                id_espectador
            }
        })

        resp.status(200).json({
            jugada_id: jugada.id_jugada,
            resultado_segmento: jugada.resultado_segmento,
            monedas_ganadas: jugada.monedas_ganadas,
            saldo_monedas_nuevo: perfilActualizado?.saldo_monedas || 0,
            puntos_actuales: progresoActualizado?.puntos_actuales || 0
        })
    } catch (error) {
        console.error("Error en ruleta:", error)
        resp.status(500).json({ error: "Error al procesar la jugada de ruleta" })
    }
})

app.get("/ruleta/historial/:id_espectador", async (req: Request, resp: Response) => {
    try {
        const { id_espectador } = req.params

        if (!id_espectador) {
            resp.status(400).json({ error: "id_espectador es requerido" })
            return
        }

        const historial = await prisma.jugadaRuleta.findMany({
            where: { id_espectador },
            orderBy: { fecha_hora: "desc" },
            take: 10
        })

        resp.status(200).json(historial)
    } catch (error) {
        resp.status(500).json({ error: "Error al obtener historial" })
    }
})

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
})

app.post("/streams/crear", async (req: Request, resp: Response) => {
    try {
        const { id_streamer, titulo } = req.body;

        if (!id_streamer || !titulo) {
            return resp.status(400).json({ error: "id_streamer y titulo son requeridos" });
        }

        const streamId = uuidv4();

        // Verificar que el streamer existe como usuario
        const streamer = await prisma.usuario.findUnique({
            where: { id_usuario: id_streamer }
        });

        if (!streamer) {
            return resp.status(400).json({
                error: "El id_streamer no existe en la base de datos"
            });
        }

        await prisma.sesionStreaming.create({
            data: {
                id_sesion: streamId,
                id_streamer,
                titulo,
                fecha_inicio: new Date()
            }
        });



        const frontendBase = process.env.FRONTEND_URL!;


        const link = `${frontendBase}/#/viewer/${streamId}`;

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