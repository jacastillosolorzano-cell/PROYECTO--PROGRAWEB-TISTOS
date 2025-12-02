import express, {Request, Response} from "express"
import http from "http"
import { Server as IOServer } from "socket.io"
import dotenv from "dotenv"
import cors from "cors"
import bodyParser from "body-parser"
import bcrypt from "bcrypt"
import { PrismaClient, Prisma } from "./generated/prisma"
import { PrismaClientKnownRequestError } from "./generated/prisma/runtime/library"

dotenv.config()
const app = express()
const PORT = process.env.PORT
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10")
const prisma = new PrismaClient()

// Helper: normalizar id_streamer a string|null (Prisma espera String)
const normalizeStreamerId = (val: any): string | null => {
    if (val === undefined || val === null) return null
    return String(val)
}

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended : true
}))

// Crear servidor HTTP y Socket.IO
const server = http.createServer(app)
const io = new IOServer(server, {
    cors: { origin: process.env.FRONTEND_URL || "http://localhost:5173" }
})

io.on("connection", (socket) => {
    console.log("Socket conectado:", socket.id)

    socket.on("join_streamer_room", (streamerId: string) => {
        try {
            socket.join(`streamer_${streamerId}`)
            console.log(`Socket ${socket.id} joined streamer_${streamerId}`)
        } catch (e) {
            console.error("Error joining room:", e)
        }
    })

    socket.on("disconnect", () => {
        console.log("Socket desconectado:", socket.id)
    })
})

app.post("/usuarios/crear", async (req : Request, resp : Response) => {
    try {
        const data = req.body
        
        if (!data.nombre || !data.email || !data.contra) {
            resp.status(400).json({ error: "Nombre, email y contraseña son requeridos" })
            return
        }

        // Hashear la contraseña
        const contrasena_hash = await bcrypt.hash(data.contra, BCRYPT_ROUNDS)

        const usuario = await prisma.usuario.create({
            data : {
                nombre : data.nombre,
                email : data.email,
                contrasena_hash : contrasena_hash,
                rol : data.rol || "ESPECTADOR",
                fecha_registro : new Date(),
                estado : data.estado || "ACTIVO"
            }
        })
        
        // No retornar la contraseña hasheada
        const { contrasena_hash: _, ...usuarioSeguro } = usuario
        resp.status(200).json(usuarioSeguro)
    } catch (error) {
        const prismaError = error as PrismaClientKnownRequestError
        if (prismaError.code === "P2002") {
            resp.status(400).json({ error: "El email ya está registrado" })
        } else {
            resp.status(500).json({ error: "Error al crear el usuario" })
        }
    }
})

app.post("/regalos/crear", async (req : Request, resp : Response) => {
    try {
        const data = req.body
        const { nombre, costo_monedas, puntos_otorgados, id_streamer } = data

        const id_streamer_str = normalizeStreamerId(id_streamer)

        if (!nombre || !costo_monedas || !puntos_otorgados || !id_streamer_str) {
            resp.status(400).json({ error: "Nombre, costo, puntos e id_streamer son requeridos" })
            return
        }

        const regalo = await prisma.regalo.create({
            data: {
                nombre,
                costo_monedas: Number(costo_monedas),
                puntos_otorgados: Number(puntos_otorgados),
                id_streamer: id_streamer_str,
                activo: true
            }
        })

        resp.status(200).json(regalo)
    } catch (error) {
        const prismaError = error as PrismaClientKnownRequestError
        resp.status(500).json({ error: "Error al crear el regalo" })
    }
})

app.get("/regalos/streamer/:id_streamer", async (req : Request, resp : Response) => {
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

app.put("/regalos/:id_regalo", async (req : Request, resp : Response) => {
    try {
        const { id_regalo } = req.params
        const data = req.body

        if (!id_regalo) {
            resp.status(400).json({ error: "id_regalo es requerido" })
            return
        }

        const actualizaciones: any = {}
        
        if (data.nombre) actualizaciones.nombre = data.nombre
        if (data.costo_monedas !== undefined) actualizaciones.costo_monedas = Number(data.costo_monedas)
        if (data.puntos_otorgados !== undefined) actualizaciones.puntos_otorgados = Number(data.puntos_otorgados)
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

app.delete("/regalos/:id_regalo", async (req : Request, resp : Response) => {
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
app.post("/ruleta/jugar", async (req : Request, resp : Response) => {
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

app.get("/ruleta/historial/:id_espectador", async (req : Request, resp : Response) => {
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

        // Buscar usuario
        const usuario = await prisma.usuario.findFirst({
            where: { email: correo }
        });

        if (!usuario) {
            return resp.status(401).json({ error: "Credenciales inválidas" });
        }

        // Validar contraseña
        const contrasenaValida = await bcrypt.compare(
            contrasena,
            usuario.contrasena_hash
        );

        if (!contrasenaValida) {
            return resp.status(401).json({ error: "Credenciales inválidas" });
        }

        // Retornar usuario sin contraseña
        const { contrasena_hash: _, ...usuarioSeguro } = usuario;

        return resp.status(200).json(usuarioSeguro);

    } catch (error) {
        console.error(error);
        return resp.status(500).json({ error: "Error al iniciar sesión" });
    }
});


app.post("/usuarios/:id_usuario/inicializar-perfil", async (req : Request, resp : Response) => {
    try {
        const { id_usuario } = req.params

        if (!id_usuario) {
            resp.status(400).json({ error: "id_usuario es requerido" })
            return
        }

        // Verificar que el usuario existe
        const usuario = await prisma.usuario.findUnique({
            where: { id_usuario }
        })

        if (!usuario) {
            resp.status(404).json({ error: "Usuario no encontrado" })
            return
        }

        // Verificar si ya tiene perfil de espectador
        let perfilExistente = await prisma.perfilEspectador.findUnique({
            where: { id_usuario }
        })

        if (!perfilExistente) {
            // Crear el perfil de espectador
            perfilExistente = await prisma.perfilEspectador.create({
                data: {
                    id_usuario,
                    saldo_monedas: 0 // Inicializar con 0 monedas
                }
            })
        }

        resp.status(200).json({ message: "Perfil de espectador listo", perfil: perfilExistente })
    } catch (error) {
        console.error("Error al crear perfil:", error)
        resp.status(500).json({ error: "Error al crear el perfil de espectador" })
    }
})

app.get("/usuarios/:id_usuario/progreso", async (req : Request, resp : Response) => {
    try {
        const { id_usuario } = req.params

        if (!id_usuario) {
            resp.status(400).json({ error: "id_usuario es requerido" })
            return
        }

        // Obtener el progreso del espectador en todos los canales, incluyendo nivel y streamer
        const progreso = await prisma.progresoEspectador.findMany({
            where: { id_espectador: id_usuario },
            include: { nivel: true, streamer: true }
        })

        // Si no tiene progreso, crear un progreso inicial por defecto
        if (progreso.length === 0) {
            // Obtener el primer streamer (si existe)
            const streamer = await prisma.usuario.findFirst({
                where: { rol: "STREAMER" }
            })

            if (streamer) {
                // Obtener el primer nivel de espectador del streamer
                const nivel = await prisma.nivelEspectador.findFirst({
                    where: { id_streamer: streamer.id_usuario }
                })

                if (nivel) {
                    const nuevoProgreso = await prisma.progresoEspectador.create({
                        data: {
                            id_espectador: id_usuario,
                            id_streamer: streamer.id_usuario,
                            puntos_actuales: 1000, // Puntos iniciales para jugar ruleta
                            id_nivel_espectador: nivel.id_nivel_espectador
                        },
                        include: { nivel: true, streamer: true }
                    })
                    return resp.status(200).json([nuevoProgreso])
                }
            }
        }

        resp.status(200).json(progreso)
    } catch (error) {
        console.error("Error al obtener progreso:", error)
        resp.status(500).json({ error: "Error al obtener progreso" })
    }
})

app.put("/usuarios/:id_usuario/rol", async (req : Request, resp : Response) => {
    try {
        const { id_usuario } = req.params
        const { rol } = req.body

        if (!id_usuario) {
            resp.status(400).json({ error: "id_usuario es requerido" })
            return
        }

        if (!rol) {
            resp.status(400).json({ error: "rol es requerido" })
            return
        }

        const usuario = await prisma.usuario.update({
            where: { id_usuario },
            data: { rol }
        })

        // Si el usuario cambia a STREAMER, crear el perfil de streamer automáticamente
        if (rol === "STREAMER") {
            const perfilStreamerExistente = await prisma.perfilStreamer.findUnique({
                where: { id_usuario }
            })

            if (!perfilStreamerExistente) {
                await prisma.perfilStreamer.create({
                    data: {
                        id_usuario,
                        horas_transmitidas_total: 0
                    }
                })
            }
        }

        // No retornar la contraseña hasheada
        const { contrasena_hash: _, ...usuarioSeguro } = usuario
        resp.status(200).json(usuarioSeguro)
    } catch (error) {
        const prismaError = error as PrismaClientKnownRequestError
        if (prismaError.code === "P2025") {
            resp.status(404).json({ error: "Usuario no encontrado" })
        } else {
            resp.status(500).json({ error: "Error al actualizar el rol" })
        }
    }
})

// Endpoint para enviar un regalo (crea EnvioRegalo y emite evento realtime)
app.post("/regalos/enviar", async (req: Request, resp: Response) => {
    try {
        const { id_regalo, id_espectador, id_streamer, cantidad = 1, id_sesion } = req.body
        const id_streamer_str = normalizeStreamerId(id_streamer)

        if (!id_regalo || !id_espectador || !id_streamer_str) {
            resp.status(400).json({ error: "id_regalo, id_espectador e id_streamer son requeridos" })
            return
        }

        // Ejecutar en transacción: validar saldo, descontar monedas, crear envio y actualizar/crear progreso
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const regalo = await tx.regalo.findUnique({ where: { id_regalo } })
            if (!regalo) throw { status: 404, message: 'Regalo no encontrado' }

            const espectador = await tx.usuario.findUnique({ where: { id_usuario: id_espectador } })
            if (!espectador) throw { status: 404, message: 'Espectador no encontrado' }

            const streamer = await tx.usuario.findUnique({ where: { id_usuario: id_streamer_str } })
            if (!streamer) throw { status: 404, message: 'Streamer no encontrado' }

            // Perfil del espectador (saldo de monedas)
            const perfil = await tx.perfilEspectador.findUnique({ where: { id_usuario: id_espectador } })
            if (!perfil) throw { status: 400, message: 'Perfil de espectador no inicializado' }

            const cantidadNum = Number(cantidad)
            const monedas_usadas = Number(regalo.costo_monedas) * cantidadNum
            const puntos_otorgados = Number(regalo.puntos_otorgados) * cantidadNum

            if ((perfil.saldo_monedas ?? 0) < monedas_usadas) {
                throw { status: 400, message: 'Saldo insuficiente', detalle: { saldo: perfil.saldo_monedas ?? 0, requerido: monedas_usadas } }
            }

            // Descontar saldo
            await tx.perfilEspectador.update({
                where: { id_usuario: id_espectador },
                data: { saldo_monedas: { decrement: monedas_usadas } }
            })

            // Crear registro de envío
            const envio = await tx.envioRegalo.create({
                data: {
                    id_regalo,
                    id_espectador,
                    id_streamer: id_streamer_str,
                    id_sesion: id_sesion || null,
                    cantidad: cantidadNum,
                    monedas_usadas,
                    puntos_otorgados
                }
            })

            // Actualizar o crear progreso del espectador
            let progreso = await tx.progresoEspectador.findFirst({ where: { id_espectador, id_streamer: id_streamer_str } })
            if (progreso) {
                await tx.progresoEspectador.update({
                    where: { id_progreso: progreso.id_progreso },
                    data: { puntos_actuales: { increment: puntos_otorgados } }
                })
                progreso = await tx.progresoEspectador.findFirst({ where: { id_espectador, id_streamer } })
            } else {
                const nivel = await tx.nivelEspectador.findFirst({
                    where: { id_streamer: id_streamer_str, activo: true },
                    orderBy: { orden: 'asc' }
                })

                if (!nivel) {
                    throw { status: 400, message: 'No hay niveles de espectador configurados para este streamer' }
                }

                progreso = await tx.progresoEspectador.create({
                    data: {
                        id_espectador,
                        id_streamer: id_streamer_str,
                        puntos_actuales: puntos_otorgados,
                        id_nivel_espectador: nivel.id_nivel_espectador
                    }
                })
            }

            return { envio, progreso, regalo, espectador, streamer }
        })

        // Emitir evento sólo al room del streamer (fuera de la transacción)
        const payload = {
            id_envio: result.envio.id_envio,
            id_regalo,
            id_espectador,
            espectador_nombre: result.espectador.nombre,
            id_streamer,
            streamer_nombre: result.streamer.nombre,
            cantidad: result.envio.cantidad,
            monedas_usadas: result.envio.monedas_usadas,
            puntos_otorgados: result.envio.puntos_otorgados,
            fecha_hora: result.envio.fecha_hora
        }

        try {
            io.to(`streamer_${id_streamer}`).emit('gift_received', payload)
        } catch (e) {
            console.error('Error emitiendo evento gift_received:', e)
        }

        resp.status(200).json({ envio: result.envio, progreso: result.progreso })
    } catch (error) {
        if (error && (error as any).status) {
            const err = error as any
            return resp.status(err.status).json({ error: err.message, ...(err.detalle ? { detalle: err.detalle } : {}) })
        }
        console.error('Error en /regalos/enviar:', error)
        resp.status(500).json({ error: 'Error al enviar regalo' })
    }
})

// Iniciar servidor HTTP (con Socket.IO)
server.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`)
})

// Endpoint para crear un mensaje en una sesión y otorgar puntos por participación
app.post("/sesiones/:id_sesion/mensajes", async (req: Request, resp: Response) => {
    try {
        const { id_sesion } = req.params
        const { id_espectador, contenido } = req.body

        if (!id_sesion || !id_espectador || !contenido) {
            resp.status(400).json({ error: "id_sesion, id_espectador y contenido son requeridos" })
            return
        }

        // Verificar que la sesión existe y obtener el id del streamer
        const sesion = await prisma.sesionStreaming.findUnique({
            where: { id_sesion }
        })

        if (!sesion) {
            resp.status(404).json({ error: "Sesión no encontrada" })
            return
        }

        // Verificar que el espectador existe
        const espectador = await prisma.usuario.findUnique({ where: { id_usuario: id_espectador } })
        if (!espectador) {
            resp.status(404).json({ error: "Espectador no encontrado" })
            return
        }

        // Crear el mensaje (por defecto otorga 1 punto)
        const mensaje = await prisma.mensajeChat.create({
            data: {
                id_sesion,
                id_espectador,
                contenido,
                puntos_otorgados: 1
            }
        })

        // Intentar actualizar el progreso del espectador para este streamer
        const id_streamer = sesion.id_streamer

        let progreso = await prisma.progresoEspectador.findFirst({
            where: { id_espectador, id_streamer }
        })

        if (progreso) {
            // Incrementar puntos
            await prisma.progresoEspectador.update({
                where: { id_progreso: progreso.id_progreso },
                data: { puntos_actuales: { increment: mensaje.puntos_otorgados } }
            })
        } else {
            // Si no hay progreso, intentar obtener un nivel activo del streamer para crear el progreso inicial
            const nivel = await prisma.nivelEspectador.findFirst({
                where: { id_streamer, activo: true },
                orderBy: { orden: 'asc' }
            })

            if (!nivel) {
                // No se puede crear progreso sin un nivel configurado
                resp.status(400).json({ error: "No hay niveles de espectador configurados para este streamer" })
                return
            }

            progreso = await prisma.progresoEspectador.create({
                data: {
                    id_espectador,
                    id_streamer,
                    puntos_actuales: mensaje.puntos_otorgados,
                    id_nivel_espectador: nivel.id_nivel_espectador
                }
            })
        }

        // Obtener el progreso actualizado
        const progresoActualizado = await prisma.progresoEspectador.findFirst({
            where: { id_espectador, id_streamer }
        })

        resp.status(200).json({
            mensaje_id: mensaje.id_mensaje,
            puntos_otorgados: mensaje.puntos_otorgados,
            puntos_actuales: progresoActualizado?.puntos_actuales || 0
        })
    } catch (error) {
        console.error("Error al crear mensaje/actualizar progreso:", error)
        resp.status(500).json({ error: "Error al procesar el mensaje" })
    }
})
