// src/routes/monedas.routes.ts
import { Router, Response } from "express";
import { prisma } from "../prisma/client.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();

/**
 * POST /monedas/recargar
 *
 * Body:
 * - monedas: número de monedas a recargar (Int)
 * - monto_pagado: monto dinero (Float) - opcional
 * - moneda: "PEN", "USD", etc. - opcional
 * - pasarela: "YAPE", "VISA", etc. - opcional
 */
router.post(
  "/recargar",
  authMiddleware,
  async (req: AuthRequest, resp: Response) => {
    try {
      if (!req.user) {
        return resp.status(401).json({ error: "No autorizado" });
      }

      const { id_usuario } = req.user;
      const { monedas, monto_pagado, moneda, pasarela } = req.body;

      const monedasNum = Number(monedas);
      const montoNum = monto_pagado !== undefined ? Number(monto_pagado) : 0;

      if (!monedasNum || isNaN(monedasNum) || monedasNum <= 0) {
        return resp
          .status(400)
          .json({ error: "monedas debe ser un número mayor a 0" });
      }

      // Aseguramos perfil de espectador
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

      const perfilActualizado = await prisma.perfilEspectador.update({
        where: { id_usuario },
        data: {
          saldo_monedas: {
            increment: monedasNum,
          },
        },
      });

      const codigo = uuidv4();

      const recarga = await prisma.recargaMonedas.create({
        data: {
          id_espectador: id_usuario,
          monedas_compradas: monedasNum,
          monto_pagado: montoNum,
          moneda: moneda || "PEN",
          pasarela: pasarela || "SIMULADA",
          codigo_comprobante: codigo,
          estado: "COMPLETADA",
        },
      });

      return resp.status(200).json({
        message: "Recarga realizada correctamente",
        saldo_monedas: perfilActualizado.saldo_monedas,
        comprobante: recarga,
      });
    } catch (error) {
      console.error("Error al recargar monedas:", error);
      return resp
        .status(500)
        .json({ error: "Error al recargar monedas" });
    }
  }
);

export default router;
