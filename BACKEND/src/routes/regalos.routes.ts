// src/routes/regalos.routes.ts
import { Router, Request, Response } from "express";
import fs from "fs";
import { prisma, PrismaClientKnownRequestError } from "../prisma/client.js";
import { normalizeStreamerId } from "../utils/normalizeStreamerId.js";
import { recalcularNivelEspectador } from "../utils/niveles.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

// =================================================================
//                    Crear regalo (solo STREAMER logueado)
// =================================================================
router.post(
  "/crear",
  authMiddleware,
  async (req: AuthRequest, resp: Response) => {
    try {
      if (!req.user) {
        return resp.status(401).json({ error: "No autorizado" });
      }

      const { id_usuario, rol } = req.user;
      const data = req.body;

      if (rol !== "STREAMER") {
        return resp
          .status(403)
          .json({ error: "Solo un streamer puede crear regalos" });
      }

      const nombre = data.nombre;
      const costo = data.costo_monedas ?? data.costo;
      const puntos = data.puntos_otorgados ?? data.puntos;

      if (!nombre || !costo || !puntos) {
        resp
          .status(400)
          .json({ error: "Nombre, costo y puntos son requeridos" });
        return;
      }

      // Verificar que el streamer exista para evitar violación de FK
      const streamerExists = await prisma.usuario.findUnique({
        where: { id_usuario },
      });
      if (!streamerExists) {
        resp.status(400).json({ error: "El streamer no existe" });
        return;
      }

      const regalo = await prisma.regalo.create({
        data: {
          nombre,
          costo_monedas: Number(costo),
          puntos_otorgados: Number(puntos),
          id_streamer: id_usuario,
          activo: true,
        },
      });

      resp.status(200).json(regalo);
    } catch (error) {
      const prismaError = error as PrismaClientKnownRequestError;

      // Registrar detalle de error en archivo temporal para diagnóstico local
      try {
        const dump = {
          time: new Date().toISOString(),
          path: "/regalos/crear",
          message: (error as any)?.message || String(error),
          stack: (error as any)?.stack || null,
        };
        fs.appendFileSync("error_debug.log", JSON.stringify(dump) + "\n");
      } catch {
        // no-op
      }

      console.error("Error en /regalos/crear:", prismaError.message || error);
      resp.status(500).json({ error: "Error al crear el regalo" });
    }
  }
);

// =================================================================
//         Obtener regalos de un streamer específico (público)
// =================================================================
router.get("/streamer/:id_streamer", async (req: Request, resp: Response) => {
  try {
    const { id_streamer } = req.params;

    if (!id_streamer) {
      resp.status(400).json({ error: "id_streamer es requerido" });
      return;
    }

    // Verificar que el streamer exista y sea STREAMER
    const streamer = await prisma.usuario.findUnique({
      where: { id_usuario: id_streamer },
    });
    if (!streamer) {
      resp.status(404).json({ error: "Streamer no encontrado" });
      return;
    }

    if (streamer.rol !== "STREAMER") {
      resp.status(403).json({ error: "El usuario no es streamer" });
      return;
    }

    // Solo listar regalos activos del streamer
    const regalos = await prisma.regalo.findMany({
      where: {
        id_streamer,
        activo: true,
      },
    });
    resp.status(200).json(regalos);
  } catch (error) {
    console.error("Error al obtener regalos por streamer:", error);
    resp.status(500).json({ error: "Error al obtener regalos" });
  }
});

// =================================================================
//                    Actualizar regalo
//       (solo STREAMER dueño del regalo puede editarlo)
// =================================================================
router.put(
  "/:id_regalo",
  authMiddleware,
  async (req: AuthRequest, resp: Response) => {
    try {
      const { id_regalo } = req.params;
      const data = req.body;

      if (!req.user) {
        return resp.status(401).json({ error: "No autorizado" });
      }

      const { id_usuario, rol } = req.user;

      if (!id_regalo) {
        resp.status(400).json({ error: "id_regalo es requerido" });
        return;
      }

      const regaloExistente = await prisma.regalo.findUnique({
        where: { id_regalo },
      });

      if (!regaloExistente) {
        return resp.status(404).json({ error: "Regalo no encontrado" });
      }

      if (rol !== "STREAMER" || regaloExistente.id_streamer !== id_usuario) {
        return resp.status(403).json({
          error: "Solo el streamer dueño del regalo puede actualizarlo",
        });
      }

      const actualizaciones: any = {};

      if (data.nombre) actualizaciones.nombre = data.nombre;
      // Aceptar ambos nombres de campo para compatibilidad
      if (data.costo_monedas !== undefined)
        actualizaciones.costo_monedas = Number(data.costo_monedas);
      if (data.costo !== undefined)
        actualizaciones.costo_monedas = Number(data.costo);
      if (data.puntos_otorgados !== undefined)
        actualizaciones.puntos_otorgados = Number(data.puntos_otorgados);
      if (data.puntos !== undefined)
        actualizaciones.puntos_otorgados = Number(data.puntos);
      if (data.activo !== undefined) actualizaciones.activo = data.activo;

      const regalo = await prisma.regalo.update({
        where: { id_regalo },
        data: actualizaciones,
      });

      resp.status(200).json(regalo);
    } catch (error) {
      const prismaError = error as PrismaClientKnownRequestError;
      if (prismaError.code === "P2025") {
        resp.status(404).json({ error: "Regalo no encontrado" });
      } else {
        console.error("Error al actualizar regalo:", error);
        resp.status(500).json({ error: "Error al actualizar el regalo" });
      }
    }
  }
);

// =================================================================
//                    Eliminar regalo
//       (solo STREAMER dueño del regalo puede eliminarlo)
// =================================================================
router.delete(
  "/:id_regalo",
  authMiddleware,
  async (req: AuthRequest, resp: Response) => {
    try {
      const { id_regalo } = req.params;

      if (!req.user) {
        return resp.status(401).json({ error: "No autorizado" });
      }

      const { id_usuario, rol } = req.user;

      if (!id_regalo) {
        resp.status(400).json({ error: "id_regalo es requerido" });
        return;
      }

      const regaloExistente = await prisma.regalo.findUnique({
        where: { id_regalo },
      });

      if (!regaloExistente) {
        return resp.status(404).json({ error: "Regalo no encontrado" });
      }

      if (rol !== "STREAMER" || regaloExistente.id_streamer !== id_usuario) {
        return resp.status(403).json({
          error: "Solo el streamer dueño del regalo puede eliminarlo",
        });
      }

      // En lugar de eliminar físicamente el registro, marcamos el regalo como inactivo
      // para evitar problemas con claves foráneas (envíos asociados)
      await prisma.regalo.update({
        where: { id_regalo },
        data: { activo: false },
      });

      resp.status(200).json({ message: "Regalo eliminado exitosamente (desactivado)" });
    } catch (error) {
      const prismaError = error as PrismaClientKnownRequestError;
      if (prismaError.code === "P2025") {
        resp.status(404).json({ error: "Regalo no encontrado" });
      } else {
        console.error("Error al eliminar regalo:", error);
        resp.status(500).json({ error: "Error al eliminar el regalo" });
      }
    }
  }
);

// =================================================================
//                    Listar Regalos activos (público)
// =================================================================
router.get("/", async (_req: Request, resp: Response) => {
  try {
    const regalos = await prisma.regalo.findMany({
      where: { activo: true },
      select: {
        id_regalo: true,
        nombre: true,
        costo_monedas: true,
        puntos_otorgados: true,
        id_streamer: true,
      },
    });

    resp.status(200).json(regalos);
  } catch (error) {
    console.error("Error al obtener regalos:", error);
    resp.status(500).json({ error: "Error al obtener regalos" });
  }
});

// =================================================================
//              Enviar regalo a streamer (compra + puntos)
//             (usuario logueado como espectador, por ej.)
// =================================================================
router.post(
  "/enviar",
  authMiddleware,
  async (req: AuthRequest, resp: Response) => {
    try {
      if (!req.user) {
        return resp.status(401).json({ error: "No autorizado" });
      }

      const { id_usuario } = req.user; // espectador
      const body = (req.body ?? {}) as {
        id_streamer?: string;
        id_regalo?: string;
        cantidad?: number;
        };

        const { id_streamer, id_regalo } = body;
        const cantidad = body.cantidad ?? 1;

        console.log("[/regalos/enviar] user:", req.user);
        console.log("[/regalos/enviar] body:", body);


      if (!id_streamer || !id_regalo) {
        return resp.status(400).json({ error: "Datos incompletos" });
      }

      // Obtener regalo
      const regalo = await prisma.regalo.findUnique({
        where: { id_regalo },
      });

      if (!regalo) {
        return resp.status(404).json({ error: "Regalo no encontrado" });
      }

      // Obtener perfil espectador
      const perfil = await prisma.perfilEspectador.findUnique({
        where: { id_usuario },
      });

      if (!perfil) {
        return resp
          .status(404)
          .json({ error: "Perfil de espectador no encontrado" });
      }

      const costoTotal = regalo.costo_monedas * cantidad;

      if (perfil.saldo_monedas < costoTotal) {
        return resp.status(400).json({
          error: "Saldo insuficiente",
          saldo_actual: perfil.saldo_monedas,
          costo: costoTotal,
        });
      }

      // RESTAR MONEDAS
      await prisma.perfilEspectador.update({
        where: { id_usuario },
        data: { saldo_monedas: { decrement: costoTotal } },
      });

      // Obtener progreso antes de sumar puntos para detectar subida de nivel
      const progresoAntes = await prisma.progresoEspectador.findFirst({
        where: { id_espectador: id_usuario, id_streamer },
        include: { nivel: true },
      });
      const nivelOrdenAntes = progresoAntes?.nivel?.orden ?? 0;

      // SUMAR PUNTOS
      await prisma.progresoEspectador.updateMany({
        where: { id_espectador: id_usuario, id_streamer },
        data: {
          puntos_actuales: {
            increment: regalo.puntos_otorgados * cantidad,
          },
        },
      });

      // Recalcular nivel del espectador y crear notificación
      await recalcularNivelEspectador(id_usuario, id_streamer);

      // Obtener progreso después de la actualización
      const progresoDespues = await prisma.progresoEspectador.findFirst({
        where: { id_espectador: id_usuario, id_streamer },
        include: { nivel: true },
      });
      const nivelOrdenDespues = progresoDespues?.nivel?.orden ?? nivelOrdenAntes;
      const nivelNombreDespues = progresoDespues?.nivel?.nombre_nivel ?? null;

      // Si subió de nivel, emitir evento en tiempo real al espectador
      if (nivelOrdenDespues > nivelOrdenAntes) {
        try {
          const socketsMap = req.app.locals?.userSockets as Record<string, string>;
          const ioServer = req.app.locals?.io;
          const socketId = socketsMap?.[id_usuario];
          if (socketId && ioServer) {
            ioServer.to(socketId).emit("level:up", {
              nivel: nivelNombreDespues,
              orden: nivelOrdenDespues,
            });
          }
        } catch (emitErr) {
          console.error("Error al emitir level-up en regalo:", emitErr);
        }
      }

      // Emitir evento en tiempo real al streamer para overlay animado
      try {
        const io = req.app.locals?.io;
        if (io) {
          // Obtener nombre del espectador
          const espectador = await prisma.usuario.findUnique({
            where: { id_usuario },
            select: { nombre: true },
          });
          const payload = {
            usuario: espectador?.nombre ?? "",
            regalo: regalo.nombre,
            puntos: regalo.puntos_otorgados * cantidad,
            timestamp: new Date().toISOString(),
          };
          const roomName = `stream_${id_streamer}`;
          // Emitir con nombre de evento original
          io.to(roomName).emit("gift:received", payload);
          // Emitir con nombre alternativo para compatibilidad con el front‑end del Studio
          io.to(roomName).emit("gift_received", payload);
        }
      } catch (err) {
        console.error("Error al emitir regalo en tiempo real:", err);
      }

      // CREAR REGISTRO
      const envio = await prisma.envioRegalo.create({
        data: {
          id_regalo,
          id_espectador: id_usuario,
          id_streamer,
          cantidad,
          monedas_usadas: costoTotal,
          puntos_otorgados: regalo.puntos_otorgados * cantidad,
        },
      });

      const newSaldo = await prisma.perfilEspectador.findUnique({
        where: { id_usuario },
      });

      resp.status(200).json({
        message: "Regalo enviado correctamente",
        envio,
        saldo_monedas: newSaldo?.saldo_monedas,
      });
    } catch (error) {
      console.error("Error al enviar regalo:", error);
      resp.status(500).json({ error: "Error al enviar regalo" });
    }
  }
);

export default router;
