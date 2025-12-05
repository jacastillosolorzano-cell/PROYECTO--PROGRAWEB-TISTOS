// src/routes/streamerPerfil.routes.ts
import { Router, Request, Response } from "express";
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
          total_minutes: 0,
          nivel_actual: 1,
          hours_per_level: 10,
        });
      }

      // En la BD guardamos minutos transmitidos acumulados
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
        total_minutes: totalMinutes,
        nivel_actual: nivelActual,
        hours_per_level: hoursPerLevel,
      });
    } catch (error) {
      console.error("Error al obtener perfil de streamer:", error);
      res.status(500).json({ error: "Error al obtener perfil de streamer" });
    }
  }
);

// ================================================================
//  Calcular las horas faltantes para que un streamer suba al siguiente nivel
//  GET /streamers/faltan-horas
//  Devuelve el nivel actual, el siguiente nivel y la cantidad de horas que faltan
// ================================================================
router.get(
  "/faltan-horas",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // Asegurar que el usuario esté autenticado
      if (!req.user) {
        return res.status(401).json({ error: "No autorizado" });
      }

      const { id_usuario } = req.user;

      // Obtener el perfil de streamer (horas acumuladas y nivel actual)
      const perfil = await prisma.perfilStreamer.findUnique({
        where: { id_usuario },
        include: { nivel: true },
      });

      const totalMinutes = perfil?.horas_transmitidas_total ?? 0;
      const totalHours = totalMinutes / 60;

      // Obtener todos los niveles de streamer ordenados
      const niveles = await prisma.nivelStreamer.findMany({
        orderBy: { orden: "asc" },
      });

      if (!niveles || niveles.length === 0) {
        // Si no hay configuración de niveles de streamer, retornar base
        return res.status(200).json({
          total_hours: totalHours,
          total_minutes: totalMinutes,
          nivel_actual: null,
          nivel_siguiente: null,
          horas_requeridas_siguiente: null,
          horas_faltantes: null,
        });
      }

      // Determinar el nivel actual según las horas transmitidas
      let nivelActual = niveles[0];
      for (const n of niveles) {
        if (totalHours >= n.horas_requeridas && n.orden >= nivelActual.orden) {
          nivelActual = n;
        }
      }

      // Encontrar el siguiente nivel (mayor orden) si existe
      const nivelSiguiente = niveles.find((n) => n.orden > nivelActual.orden) ?? null;

      let horasFaltantes: number | null = null;
      let horasRequeridasSiguiente: number | null = null;
      if (nivelSiguiente) {
        horasRequeridasSiguiente = nivelSiguiente.horas_requeridas;
        const diff = nivelSiguiente.horas_requeridas - totalHours;
        horasFaltantes = diff > 0 ? diff : 0;
      }

      return res.status(200).json({
        total_hours: totalHours,
        total_minutes: totalMinutes,
        nivel_actual: nivelActual.nombre_nivel,
        nivel_orden_actual: nivelActual.orden,
        nivel_siguiente: nivelSiguiente?.nombre_nivel ?? null,
        nivel_orden_siguiente: nivelSiguiente?.orden ?? null,
        horas_requeridas_siguiente: horasRequeridasSiguiente,
        horas_faltantes: horasFaltantes,
      });
    } catch (error) {
      console.error("Error al calcular horas faltantes del streamer:", error);
      return res
        .status(500)
        .json({ error: "Error al calcular horas faltantes del streamer" });
    }
  }
);

// ================================================================
//  Obtener perfil de un streamer por id (público)
//  GET /streamers/perfil/:id_streamer
//  Devuelve horas transmitidas totales y nivel asignado
// ================================================================
router.get(
  "/perfil/:id_streamer",
  async (req: Request, res: Response) => {
    try {
      const { id_streamer } = req.params as { id_streamer?: string };
      if (!id_streamer) {
        return res.status(400).json({ error: "id_streamer es requerido" });
      }

      // Buscar perfil del streamer
      const perfil = await prisma.perfilStreamer.findUnique({
        where: { id_usuario: id_streamer },
        include: { nivel: { select: { orden: true, nombre_nivel: true } } },
      });

      if (!perfil) {
        return res.status(404).json({ error: "Perfil de streamer no encontrado" });
      }

      const totalMinutes = perfil.horas_transmitidas_total ?? 0;

      return res.status(200).json({
        id_usuario: id_streamer,
        horas_transmitidas_total: totalMinutes,
        nivel: perfil.nivel ?? null,
      });
    } catch (error) {
      console.error("Error al obtener perfil de streamer por id:", error);
      return res
        .status(500)
        .json({ error: "Error al obtener perfil de streamer" });
    }
  }
);

export default router;
