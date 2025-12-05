// src/routes/niveles.routes.ts
import { Router, Request, Response } from "express";
import { prisma } from "../prisma/client.js";
import { recalcularNivelEspectador } from "../utils/niveles.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

// Listar niveles de espectador para un streamer (público)
router.get(
  "/espectador/:id_streamer",
  async (req: Request, resp: Response) => {
    try {
      const { id_streamer } = req.params;
      if (!id_streamer) {
        return resp.status(400).json({ error: "id_streamer es requerido" });
      }

      const niveles = await prisma.nivelEspectador.findMany({
        where: { id_streamer, activo: true },
        orderBy: { orden: "asc" },
      });

      return resp.status(200).json(niveles);
    } catch (error) {
      console.error("Error al listar niveles de espectador:", error);
      return resp
        .status(500)
        .json({ error: "Error al listar niveles de espectador" });
    }
  }
);

// Crear nivel de espectador (solo STREAMER logueado)
router.post(
  "/espectador",
  authMiddleware,
  async (req: AuthRequest, resp: Response) => {
    try {
      if (!req.user) {
        return resp.status(401).json({ error: "No autorizado" });
      }

      const { id_usuario, rol } = req.user;
      const { nombre_nivel, orden, puntos_requeridos } = req.body;

      if (rol !== "STREAMER") {
        return resp
          .status(403)
          .json({ error: "Solo un streamer puede crear niveles" });
      }

      if (!nombre_nivel || orden === undefined || puntos_requeridos === undefined) {
        return resp
          .status(400)
          .json({ error: "nombre_nivel, orden y puntos_requeridos son requeridos" });
      }

      const nivel = await prisma.nivelEspectador.create({
        data: {
          id_streamer: id_usuario,
          nombre_nivel,
          orden: Number(orden),
          puntos_requeridos: Number(puntos_requeridos),
          activo: true,
        },
      });

      return resp.status(201).json(nivel);
    } catch (error) {
      console.error("Error al crear nivel de espectador:", error);
      return resp
        .status(500)
        .json({ error: "Error al crear nivel de espectador" });
    }
  }
);

// Actualizar nivel de espectador (solo STREAMER dueño)
router.put(
  "/espectador/:id_nivel",
  authMiddleware,
  async (req: AuthRequest, resp: Response) => {
    try {
      if (!req.user) {
        return resp.status(401).json({ error: "No autorizado" });
      }
      const { id_usuario, rol } = req.user;
      const { id_nivel } = req.params;
      const { nombre_nivel, orden, puntos_requeridos, activo } = req.body;

      if (!id_nivel) {
        return resp.status(400).json({ error: "id_nivel es requerido" });
      }

      const nivelExistente = await prisma.nivelEspectador.findUnique({
        where: { id_nivel_espectador: id_nivel },
      });

      if (!nivelExistente) {
        return resp.status(404).json({ error: "Nivel no encontrado" });
      }

      if (rol !== "STREAMER" || nivelExistente.id_streamer !== id_usuario) {
        return resp.status(403).json({
          error: "Solo el streamer dueño del nivel puede actualizarlo",
        });
      }

      const data: any = {};
      if (nombre_nivel !== undefined) data.nombre_nivel = nombre_nivel;
      if (orden !== undefined) data.orden = Number(orden);
      if (puntos_requeridos !== undefined)
        data.puntos_requeridos = Number(puntos_requeridos);
      if (activo !== undefined) data.activo = !!activo;

      const nivelActualizado = await prisma.nivelEspectador.update({
        where: { id_nivel_espectador: id_nivel },
        data,
      });

      // Recalcular niveles de todos los espectadores del streamer si se modifican los puntos requeridos
      if (puntos_requeridos !== undefined) {
        const progresos = await prisma.progresoEspectador.findMany({
          where: { id_streamer: id_usuario },
          select: { id_espectador: true },
        });
        for (const prog of progresos) {
          await recalcularNivelEspectador(prog.id_espectador, id_usuario);
        }
      }

      return resp.status(200).json(nivelActualizado);
    } catch (error) {
      console.error("Error al actualizar nivel de espectador:", error);
      return resp
        .status(500)
        .json({ error: "Error al actualizar nivel de espectador" });
    }
  }
);

// =====================================================
//  ⭐ Nuevo: Actualizar puntos base por nivel de espectadores
//
// Permite que un streamer ajuste los puntos requeridos por nivel para todos sus
// niveles activos de espectadores. Esto recalcula los puntos requeridos como
// `base * orden` para cada nivel y actualiza el progreso de todos los
// espectadores en ese canal.  El streamer debe estar autenticado y ser dueño
// del canal para modificar estos valores.
router.put(
  "/espectador/base/:id_streamer",
  authMiddleware,
  async (req: AuthRequest, resp: Response) => {
    try {
      if (!req.user) {
        return resp.status(401).json({ error: "No autorizado" });
      }
      const { id_usuario, rol } = req.user;
      const { id_streamer } = req.params;
      const { base } = req.body as { base?: number };

      // Validaciones básicas
      if (!id_streamer) {
        return resp
          .status(400)
          .json({ error: "id_streamer es requerido" });
      }

      // Debe ser streamer y dueño del canal
      if (rol !== "STREAMER" || id_usuario !== id_streamer) {
        return resp.status(403).json({
          error: "Solo el streamer dueño del canal puede actualizar sus niveles",
        });
      }

      const newBase = Number(base);
      if (!newBase || isNaN(newBase) || newBase <= 0) {
        return resp
          .status(400)
          .json({ error: "Base debe ser un número positivo" });
      }

      // Obtener niveles activos del streamer
      const niveles = await prisma.nivelEspectador.findMany({
        where: { id_streamer, activo: true },
        orderBy: { orden: "asc" },
      });

      // Si no hay niveles, devolver error
      if (niveles.length === 0) {
        return resp
          .status(400)
          .json({ error: "No hay niveles de espectador configurados" });
      }

      // Actualizar cada nivel con base * orden
      for (const nivel of niveles) {
        const nuevoValor = newBase * nivel.orden;
        await prisma.nivelEspectador.update({
          where: { id_nivel_espectador: nivel.id_nivel_espectador },
          data: { puntos_requeridos: nuevoValor },
        });
      }

      // Recalcular progreso de todos los espectadores de este streamer
      const progresos = await prisma.progresoEspectador.findMany({
        where: { id_streamer },
        select: { id_espectador: true },
      });
      for (const prog of progresos) {
        await recalcularNivelEspectador(prog.id_espectador, id_streamer);
      }

      return resp.status(200).json({
        message: "Niveles de espectadores actualizados correctamente",
        base: newBase,
      });
    } catch (error) {
      console.error(
        "Error al actualizar puntos base de niveles de espectador:",
        error
      );
      return resp.status(500).json({
        error: "Error al actualizar los niveles de espectador",
      });
    }
  }
);

export default router;
