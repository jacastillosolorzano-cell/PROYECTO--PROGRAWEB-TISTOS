// src/routes/progreso.routes.ts (por ejemplo)
import { Router } from "express";
import { prisma } from "../prisma/client.js";

const router = Router();

// Sumar 1 punto por participación (mensaje), sin necesidad de id_sesion
router.post("/usuarios/:id_espectador/mensaje", async (req, resp) => {
  try {
    const { id_espectador } = req.params;
    const { id_streamer } = req.body; // opcional

    // buscamos algún progreso existente; si no hay, salimos con error amigable
    let progreso = await prisma.progresoEspectador.findFirst({
      where: {
        id_espectador,
        ...(id_streamer ? { id_streamer } : {}),
      },
    });

    if (!progreso) {
      return resp.status(400).json({
        error: "No tienes progreso asignado todavía. El streamer debe configurar niveles.",
      });
    }

    const actualizado = await prisma.progresoEspectador.update({
      where: { id_progreso: progreso.id_progreso },
      data: { puntos_actuales: { increment: 1 } },
    });

    return resp.status(200).json(actualizado);
  } catch (error) {
    console.error("Error al sumar punto por mensaje:", error);
    return resp.status(500).json({ error: "Error al sumar punto por mensaje" });
  }
});

export default router;
