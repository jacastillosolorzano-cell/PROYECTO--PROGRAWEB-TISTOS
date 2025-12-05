// src/routes/nivelStreamer.routes.ts
import { Router, Request, Response } from "express";
import { prisma } from "../prisma/client.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";
import { recalcularNivelStreamer } from "../utils/niveles.js";

const router = Router();

// =============================================================
//        Actualizar un nivel de streamer (horas requeridas)
//        Ejemplo: PUT /niveles/streamer/:id_nivel_streamer
// =============================================================
router.put(
  "/streamer/:id_nivel",
  authMiddleware,
  async (req: AuthRequest, resp: Response) => {
    try {
      const { id_nivel } = req.params;
      const { horas_requeridas, nombre_nivel, orden } = req.body;

      if (!req.user) {
        return resp.status(401).json({ error: "No autorizado" });
      }

      // Solo permitir a streamers modificar la configuración global de niveles
      if (req.user.rol !== "STREAMER") {
        return resp
          .status(403)
          .json({ error: "Solo un streamer puede actualizar niveles" });
      }

      const nivel = await prisma.nivelStreamer.findUnique({
        where: { id_nivel_streamer: id_nivel },
      });
      if (!nivel) {
        return resp.status(404).json({ error: "Nivel de streamer no encontrado" });
      }

      const data: any = {};
      if (horas_requeridas !== undefined) data.horas_requeridas = Number(horas_requeridas);
      if (nombre_nivel !== undefined) data.nombre_nivel = nombre_nivel;
      if (orden !== undefined) data.orden = Number(orden);

      const actualizado = await prisma.nivelStreamer.update({
        where: { id_nivel_streamer: id_nivel },
        data,
      });

      // Recalcular el nivel de todos los streamers cuyos perfiles puedan verse afectados
      const perfiles = await prisma.perfilStreamer.findMany({
        select: { id_usuario: true },
      });
      for (const p of perfiles) {
        await recalcularNivelStreamer(p.id_usuario);
      }

      return resp.status(200).json(actualizado);
    } catch (error) {
      console.error("Error al actualizar nivelStreamer:", error);
      return resp
        .status(500)
        .json({ error: "Error al actualizar nivel de streamer" });
    }
  }
);

export default router;