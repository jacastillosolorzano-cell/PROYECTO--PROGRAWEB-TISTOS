// src/routes/streams.routes.ts
import { Router, Response } from "express";
import { prisma } from "../prisma/client.js";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

// =================================================================
//                    Crear stream (solo STREAMER logueado)
// =================================================================
router.post(
  "/crear",
  authMiddleware,
  async (req: AuthRequest, resp: Response) => {
    try {
      const { titulo } = req.body;

      if (!req.user) {
        return resp.status(401).json({ error: "No autorizado" });
      }

      const { id_usuario, rol } = req.user;

      if (!titulo) {
        return resp
          .status(400)
          .json({ error: "El título del stream es requerido" });
      }

      if (rol !== "STREAMER") {
        return resp
          .status(403)
          .json({ error: "Solo un streamer puede crear streams" });
      }

      const streamId = uuidv4();

      // Verificar que el streamer existe como usuario
      const streamer = await prisma.usuario.findUnique({
        where: { id_usuario },
      });

      if (!streamer) {
        return resp.status(400).json({
          error: "El streamer no existe en la base de datos",
        });
      }

      await prisma.sesionStreaming.create({
        data: {
          id_sesion: streamId,
          id_streamer: id_usuario,
          titulo,
          fecha_inicio: new Date(),
        },
      });

      const frontendBase = process.env.FRONTEND_URL!;
      const link = `${frontendBase}/#/viewer/${streamId}`;

      resp.status(200).json({ streamId, link });
    } catch (error) {
      console.error("Error al crear stream:", error);
      resp.status(500).json({ error: "Error al crear stream" });
    }
  }
);

// =================================================================
//        Finalizar stream (solo el streamer dueño de la sesión)
// =================================================================
router.post(
  "/:id_sesion/finalizar",
  authMiddleware,
  async (req: AuthRequest, resp: Response) => {
    try {
      const { id_sesion } = req.params;

      if (!req.user) {
        return resp.status(401).json({ error: "No autorizado" });
      }

      const { id_usuario, rol } = req.user;

      const sesion = await prisma.sesionStreaming.findUnique({
        where: { id_sesion },
      });

      if (!sesion) {
        return resp.status(404).json({ error: "Sesión no encontrada" });
      }

      // Validar que quien intenta cerrar sea el streamer dueño de la sesión
      if (rol !== "STREAMER" || sesion.id_streamer !== id_usuario) {
        return resp.status(403).json({
          error: "Solo el streamer dueño de la sesión puede finalizarla",
        });
      }

      const fecha_fin = new Date();
      const duracion = Math.floor(
        (fecha_fin.getTime() - sesion.fecha_inicio.getTime()) / 60000
      );

      const actualizada = await prisma.sesionStreaming.update({
        where: { id_sesion },
        data: {
          fecha_fin,
          duracion_minutos: duracion,
        },
      });

      resp
        .status(200)
        .json({ message: "Sesión finalizada", sesion: actualizada });
    } catch (error) {
      console.error("Error al finalizar sesión de stream:", error);
      resp.status(500).json({ error: "Error al finalizar sesión" });
    }
  }
);

export default router;
