// src/routes/chat.routes.ts
import { Router, Request, Response } from "express";
import { prisma } from "../prisma/client.js";
import { recalcularNivelEspectador } from "../utils/niveles.js";

const router = Router();

// =================================================================
//                 OBTENER LISTA DE CHATS (Streamers)
// =================================================================
// Esta es la ruta que te estaba dando 404
router.get("/lista/:id_usuario", async (req: Request, resp: Response) => {
  try {
    const { id_usuario } = req.params;

    // Buscamos en ProgresoEspectador para ver con qué streamers ha interactuado
    const progresos = await prisma.progresoEspectador.findMany({
      where: {
        id_espectador: id_usuario,
      },
      include: {
        streamer: {
          select: {
            id_usuario: true,
            nombre: true,
            // Agrega foto si la tienes en BD
          },
        },
        nivel: true,
      },
    });

    // Mapeamos a la estructura que espera el frontend
    const chats = progresos.map((p) => ({
      id: p.streamer.id_usuario,
      nombre: p.streamer.nombre,
      mensaje: `Nivel ${p.nivel?.orden ?? 1} • ${p.puntos_actuales} pts`,
      level: p.nivel?.orden ?? 1,
      // El avatar lo asigna el frontend aleatoriamente
    }));

    return resp.status(200).json(chats);
  } catch (error) {
    console.error("Error obteniendo lista de chats:", error);
    return resp.status(500).json({ error: "Error al obtener chats" });
  }
});

// =================================================================
//                  CHAT + PUNTOS POR MENSAJE
// =================================================================
router.post("/:id_sesion/mensajes", async (req: Request, resp: Response) => {
  try {
    const { id_sesion } = req.params;
    const { id_espectador, contenido } = req.body;

    if (!id_sesion || !id_espectador || !contenido) {
      return resp.status(400).json({ error: "Datos incompletos" });
    }

    const sesion = await prisma.sesionStreaming.findUnique({
      where: { id_sesion },
    });

    if (!sesion) {
      return resp.status(404).json({ error: "Sesión no encontrada" });
    }

    // 1. Crear mensaje con 1 punto
    const mensaje = await prisma.mensajeChat.create({
      data: {
        id_sesion,
        id_espectador,
        contenido,
        puntos_otorgados: 1,
      },
    });

    // 2. Sumar 1 punto en progresoEspectador
    await prisma.progresoEspectador.updateMany({
      where: {
        id_espectador,
        id_streamer: sesion.id_streamer,
      },
      data: {
        puntos_actuales: {
          increment: 1,
        },
      },
    });

    // 3. Recalcular nivel
    await recalcularNivelEspectador(id_espectador, sesion.id_streamer);

    // 4. Devolver respuesta
    const progresoActualizado = await prisma.progresoEspectador.findFirst({
      where: {
        id_espectador,
        id_streamer: sesion.id_streamer,
      },
      include: {
        nivel: true,
        streamer: {
          select: {
            id_usuario: true,
            nombre: true,
          },
        },
      },
    });

    return resp.status(200).json({
      mensaje,
      progreso: progresoActualizado,
    });
  } catch (error) {
    console.error("Error en chat:", error);
    resp.status(500).json({ error: "Error en chat" });
  }
});

export default router;
