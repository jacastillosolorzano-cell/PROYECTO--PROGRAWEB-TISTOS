// src/routes/streamers.routes.ts
import { Router, Request, Response } from "express";
import { prisma } from "../prisma/client.js";

const router = Router();

/**
 * GET /streamers/:id_streamer/estadisticas
 * - total_minutos_transmitidos
 * - total_horas_transmitidas
 * Usa PerfilStreamer si existe, si no, suma SesionStreaming.
 */
router.get(
  "/:id_streamer/estadisticas",
  async (req: Request, resp: Response) => {
    try {
      const { id_streamer } = req.params;

      if (!id_streamer) {
        return resp.status(400).json({ error: "id_streamer es requerido" });
      }

      // Intentar leer desde PerfilStreamer
      let total_minutos = 0;
      const perfil = await prisma.perfilStreamer.findUnique({
        where: { id_usuario: id_streamer },
      });

      if (perfil) {
        total_minutos = perfil.horas_transmitidas_total;
      } else {
        // Fallback: sumar desde SesionStreaming
        const sesiones = await prisma.sesionStreaming.findMany({
          where: { id_streamer },
          select: { duracion_minutos: true },
        });

        total_minutos = sesiones.reduce(
          (acc, s) => acc + (s.duracion_minutos ?? 0),
          0
        );
      }

      const total_horas = total_minutos / 60;

      return resp.status(200).json({
        id_streamer,
        total_minutos_transmitidos: total_minutos,
        total_horas_transmitidas: total_horas,
      });
    } catch (error) {
      console.error("Error al obtener estadísticas de streamer:", error);
      return resp
        .status(500)
        .json({ error: "Error al obtener estadísticas de streamer" });
    }
  }

  
);
// Obtener perfil del streamer (horas transmitidas, nivel, etc.)
router.get("/perfil/:id_streamer", async (req, res) => {
  try {
    const { id_streamer } = req.params;

    const perfil = await prisma.perfilStreamer.findUnique({
      where: { id_usuario: id_streamer },
    });

    if (!perfil) {
      return res.status(404).json({ error: "Perfil no encontrado" });
    }

    return res.json(perfil);
  } catch (err) {
    console.error("Error al obtener perfil del streamer:", err);
    return res.status(500).json({ error: "Error interno al obtener perfil" });
  }
});


export default router;
