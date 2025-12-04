// src/routes/chat.routes.ts
import { Router, Request, Response } from "express";
import { prisma } from "../prisma/client.js";

const router = Router();

// =================================================================
//                   CHAT + PUNTOS POR MENSAJE
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

    const mensaje = await prisma.mensajeChat.create({
      data: {
        id_sesion,
        id_espectador,
        contenido,
        puntos_otorgados: 1,
      },
    });

    resp.status(200).json({ mensaje });
  } catch (error) {
    console.error("Error en chat:", error);
    resp.status(500).json({ error: "Error en chat" });
  }
});

export default router;
