// src/routes/notificaciones.routes.ts
import { Router, Response } from "express";
import { prisma } from "../prisma/client.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

// Listar notificaciones del usuario logueado
router.get("/", authMiddleware, async (req: AuthRequest, resp: Response) => {
  try {
    if (!req.user) {
      return resp.status(401).json({ error: "No autorizado" });
    }

    const { id_usuario } = req.user;

    const notificaciones = await prisma.notificacion.findMany({
      where: { id_usuario },
      orderBy: { fecha_hora: "desc" },
    });

    return resp.status(200).json(notificaciones);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return resp
      .status(500)
      .json({ error: "Error al obtener notificaciones" });
  }
});

// Marcar notificación como leída
router.post(
  "/:id_notificacion/leido",
  authMiddleware,
  async (req: AuthRequest, resp: Response) => {
    try {
      if (!req.user) {
        return resp.status(401).json({ error: "No autorizado" });
      }

      const { id_usuario } = req.user;
      const { id_notificacion } = req.params;

      const notif = await prisma.notificacion.findUnique({
        where: { id_notificacion },
      });

      if (!notif || notif.id_usuario !== id_usuario) {
        return resp.status(404).json({ error: "Notificación no encontrada" });
      }

      const actualizada = await prisma.notificacion.update({
        where: { id_notificacion },
        data: { leido: true },
      });

      return resp.status(200).json(actualizada);
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
      return resp
        .status(500)
        .json({ error: "Error al marcar notificación" });
    }
  }
);

export default router;
