// src/routes/recargas.routes.ts
import { Router, Response } from "express";
import { prisma } from "../prisma/client.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * POST /recargas
 * Crea una recarga y suma monedas al perfil del espectador.
 */
router.post("/", authMiddleware, async (req: AuthRequest, resp: Response) => {
  try {
    if (!req.user) {
      return resp.status(401).json({ error: "No autorizado" });
    }

    const { id_usuario } = req.user;
    const {
      monedas_compradas,
      monto_pagado,
      moneda = "PEN",
      pasarela = "FAKE-PASARELA",
    } = req.body;

    if (
      !monedas_compradas ||
      !monto_pagado ||
      Number(monedas_compradas) <= 0 ||
      Number(monto_pagado) <= 0
    ) {
      return resp.status(400).json({
        error:
          "monedas_compradas y monto_pagado son requeridos y deben ser mayores a 0",
      });
    }

    // Asegurar que el usuario tiene PerfilEspectador
    let perfil = await prisma.perfilEspectador.findUnique({
      where: { id_usuario },
    });

    if (!perfil) {
      perfil = await prisma.perfilEspectador.create({
        data: {
          id_usuario,
          saldo_monedas: 0,
        },
      });
    }

    // Simulamos código de comprobante
    const codigo_comprobante = `REC-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    // Creamos la recarga
    const recarga = await prisma.recargaMonedas.create({
      data: {
        id_espectador: id_usuario,
        monedas_compradas: Number(monedas_compradas),
        monto_pagado: Number(monto_pagado),
        moneda,
        pasarela,
        codigo_comprobante,
        estado: "COMPLETADO",
      },
    });

    // Actualizar saldo
    const perfilActualizado = await prisma.perfilEspectador.update({
      where: { id_usuario },
      data: {
        saldo_monedas: {
          increment: Number(monedas_compradas),
        },
      },
    });

    return resp.status(200).json({
      message: "Recarga registrada correctamente",
      recarga,
      saldo_monedas_nuevo: perfilActualizado.saldo_monedas,
    });
  } catch (error) {
    console.error("Error en POST /recargas:", error);
    return resp.status(500).json({ error: "Error al registrar recarga" });
  }
});

/**
 * GET /recargas/historial
 * Lista las recargas del usuario logueado (espectador).
 */
router.get(
  "/historial",
  authMiddleware,
  async (req: AuthRequest, resp: Response) => {
    try {
      if (!req.user) {
        return resp.status(401).json({ error: "No autorizado" });
      }

      const { id_usuario } = req.user;

      const recargas = await prisma.recargaMonedas.findMany({
        where: { id_espectador: id_usuario },
        orderBy: { fecha_hora: "desc" },
      });

      return resp.status(200).json(recargas);
    } catch (error) {
      console.error("Error en GET /recargas/historial:", error);
      return resp.status(500).json({
        error: "Error al obtener historial de recargas",
      });
    }
  }
);

export default router;
