// src/routes/streamerPerfil.routes.ts
import { Router, Response } from "express";
import { prisma } from "../prisma/client.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * GET /streamers/perfil
 * Devuelve:
 *  - total_hours: horas totales transmitidas (float)
 *  - nivel_actual: nivel calculado
 *  - hours_per_level: horas que se usan para subir cada nivel (para UI)
 */
router.get(
  "/perfil",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "No autorizado" });
      }

      const { id_usuario } = req.user;

      // perfilStreamer se va llenando en /streams/:id_sesion/finalizar
      const perfil = await prisma.perfilStreamer.findUnique({
        where: { id_usuario },
      });

      if (!perfil) {
        // Si nunca ha streameado, devolvemos base
        return res.json({
          total_hours: 0,
          nivel_actual: 1,
          hours_per_level: 10,
        });
      }

      // En la BD guardamos minutos, los convertimos a horas
      const totalMinutes = perfil.horas_transmitidas_total ?? 0;
      const totalHours = totalMinutes / 60;

      // Puedes ajustar esta constante si quieres niveles más rápidos/lentos
      const hoursPerLevel = 10;

      const nivelActual = Math.max(
        1,
        Math.floor(totalHours / Math.max(1, hoursPerLevel)) + 1
      );

      res.json({
        total_hours: totalHours,
        nivel_actual: nivelActual,
        hours_per_level: hoursPerLevel,
      });
    } catch (error) {
      console.error("Error al obtener perfil de streamer:", error);
      res.status(500).json({ error: "Error al obtener perfil de streamer" });
    }
  }
);

export default router;
