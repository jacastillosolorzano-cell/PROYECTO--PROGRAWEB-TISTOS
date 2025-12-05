// src/routes/streams.routes.ts
import { Router, Request, Response } from "express";
import { prisma } from "../prisma/client.js";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";
import { recalcularNivelStreamer } from "../utils/niveles.js";

const router = Router();
router.get("/:id_sesion", async (req: Request, resp: Response) => {
  try {
    const { id_sesion } = req.params;

    const sesion = await prisma.sesionStreaming.findUnique({
      where: { id_sesion },
      select: {
        id_streamer: true,
        titulo: true,
        fecha_inicio: true,
        fecha_fin: true,
        duracion_minutos: true,
      },
    });

    if (!sesion) {
      return resp.status(404).json({ error: "Sesión no encontrada" });
    }

    return resp.status(200).json(sesion);
  } catch (error) {
    console.error("Error al obtener sesión:", error);
    return resp.status(500).json({ error: "Error al obtener sesión" });
  }
});
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

      // Si FRONTEND_URL está configurada, devolvemos el link completo.
      // Si no, devolvemos `link: null` para que el frontend construya la URL
      // usando `window.location.origin` (esto hace que funcione en cualquier host).
      const frontendBase = process.env.FRONTEND_URL ?? null;
      const link = frontendBase
        ? `${String(frontendBase).replace(/\/$/, '')}/#/viewer/${streamId}`
        : null;

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

      // Obtener perfil y nivel antes de actualizar para detectar subida de nivel
      const perfilAntes = await prisma.perfilStreamer.findUnique({
        where: { id_usuario },
        include: { nivel: true },
      });
      const nivelOrdenAntes = perfilAntes?.nivel?.orden ?? 0;

      const actualizada = await prisma.sesionStreaming.update({
        where: { id_sesion },
        data: {
          fecha_fin,
          duracion_minutos: duracion,
        },
      });

      // Actualizar PerfilStreamer (acumulando minutos)
      let perfil = await prisma.perfilStreamer.findUnique({
        where: { id_usuario },
        include: { nivel: true },
      });

      if (!perfil) {
        perfil = await prisma.perfilStreamer.create({
          data: {
            id_usuario,
            horas_transmitidas_total: duracion, // almacenamos minutos
          },
          include: { nivel: true },
        });
      } else {
        perfil = await prisma.perfilStreamer.update({
          where: { id_usuario },
          data: {
            horas_transmitidas_total: {
              increment: duracion,
            },
          },
          include: { nivel: true },
        });
      }

      // Recalcular nivel del streamer (puede generar notificación)
      await recalcularNivelStreamer(id_usuario);

      // Consultar de nuevo el perfil para obtener el nuevo nivel
      const perfilDespues = await prisma.perfilStreamer.findUnique({
        where: { id_usuario },
        include: { nivel: true },
      });
      const nivelOrdenDespues = perfilDespues?.nivel?.orden ?? nivelOrdenAntes;
      const nivelNombreDespues = perfilDespues?.nivel?.nombre_nivel ?? null;

      // Si subió de nivel, emitir evento al socket del streamer.
      // Para mantener consistencia con el front‑end, usamos el mismo nombre de
      // evento "level:up" que se utiliza para los espectadores. De este modo,
      // cualquier cliente que escuche este evento mostrará el aviso de subida de nivel.
      if (nivelOrdenDespues > nivelOrdenAntes) {
        try {
          const socketsMap = req.app.locals.userSockets as Record<string, string>;
          const ioServer = req.app.locals.io;
          const socketId = socketsMap?.[id_usuario];
          if (socketId && ioServer) {
            ioServer.to(socketId).emit("level:up", {
              nivel: nivelNombreDespues,
              orden: nivelOrdenDespues,
            });
          }
        } catch (emitError) {
          console.error(
            "Error al emitir evento de subida de nivel del streamer:",
            emitError
          );
        }
      }

      resp
        .status(200)
        .json({ message: "Sesión finalizada", sesion: actualizada, perfilStreamer: perfil });
    } catch (error) {
      console.error("Error al finalizar sesión de stream:", error);
      resp.status(500).json({ error: "Error al finalizar sesión" });
    }
  }
);
export default router;
