// src/routes/ruleta.routes.ts
import { Router, Request, Response } from "express";
import { prisma } from "../prisma/client.js";
import { normalizeStreamerId } from "../utils/normalizeStreamerId.js";

const router = Router();

// ============== RULETA ==============
router.post("/jugar", async (req: Request, resp: Response) => {
  try {
    const { id_espectador, puntos_apostados, id_streamer } = req.body;
    const id_streamer_str = normalizeStreamerId(id_streamer);

    if (!id_espectador || !puntos_apostados) {
      resp
        .status(400)
        .json({ error: "id_espectador y puntos_apostados son requeridos" });
      return;
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: id_espectador },
      include: { perfilEspectador: true },
    });

    if (!usuario) {
      resp.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // Si no tiene perfil de espectador, crear uno
    let perfilEspectador = usuario.perfilEspectador;
    if (!perfilEspectador) {
      perfilEspectador = await prisma.perfilEspectador.create({
        data: {
          id_usuario: id_espectador,
          saldo_monedas: 0,
        },
      });
    }

    // Obtener o crear el progreso del espectador (para los puntos)
    let progreso = await prisma.progresoEspectador.findFirst({
      where: {
        id_espectador,
      },
    });

    // Si no tiene progreso, no podemos jugar sin tener un nivel asignado
    if (!progreso) {
      resp.status(400).json({
        error:
          "No tienes puntos asignados. Contacta a un administrador para asignarte puntos.",
        puntos_disponibles: 0,
      });
      return;
    }

    // Verificar que tiene suficientes puntos
    if (progreso.puntos_actuales < puntos_apostados) {
      resp.status(400).json({
        error: "No tienes suficientes puntos",
        puntos_disponibles: progreso.puntos_actuales,
        puntos_requeridos: puntos_apostados,
      });
      return;
    }

    // Definir los sectores de la ruleta
    const sectores = [
      { label: "+5", monedas: 5 },
      { label: "+10", monedas: 10 },
      { label: "+20", monedas: 20 },
      { label: "+50", monedas: 50 },
      { label: "+100", monedas: 100 },
      { label: "x2", monedas: 50 }, // especial: x2 = 50 monedas
    ];

    // Elegir un sector aleatorio
    const indiceAleatorio = Math.floor(Math.random() * sectores.length);
    const sectorAleatorio = sectores[indiceAleatorio];

    if (!sectorAleatorio) {
      resp.status(500).json({ error: "Error al seleccionar sector de ruleta" });
      return;
    }

    const monedas_ganadas = sectorAleatorio.monedas;

    // Registrar la jugada en la base de datos
    const jugada = await prisma.jugadaRuleta.create({
      data: {
        id_espectador,
        id_streamer: id_streamer_str,
        puntos_apostados,
        resultado_segmento: sectorAleatorio.label,
        monedas_ganadas,
        puntos_convertidos: 0,
      },
    });

    // Actualizar el saldo de monedas del usuario (SUMAR)
    await prisma.perfilEspectador.update({
      where: { id_usuario: id_espectador },
      data: { saldo_monedas: { increment: monedas_ganadas } },
    });

    // Actualizar los puntos del usuario (RESTAR)
    await prisma.progresoEspectador.update({
      where: { id_progreso: progreso.id_progreso },
      data: { puntos_actuales: { decrement: puntos_apostados } },
    });

    // Obtener los datos actualizados
    const perfilActualizado = await prisma.perfilEspectador.findUnique({
      where: { id_usuario: id_espectador },
    });

    const progresoActualizado = await prisma.progresoEspectador.findFirst({
      where: {
        id_espectador,
      },
    });

    resp.status(200).json({
      jugada_id: jugada.id_jugada,
      resultado_segmento: jugada.resultado_segmento,
      monedas_ganadas: jugada.monedas_ganadas,
      saldo_monedas_nuevo: perfilActualizado?.saldo_monedas || 0,
      puntos_actuales: progresoActualizado?.puntos_actuales || 0,
    });
  } catch (error) {
    console.error("Error en ruleta:", error);
    resp
      .status(500)
      .json({ error: "Error al procesar la jugada de ruleta" });
  }
});

// Historial de jugadas
router.get("/historial/:id_espectador", async (req: Request, resp: Response) => {
  try {
    const { id_espectador } = req.params;

    if (!id_espectador) {
      resp.status(400).json({ error: "id_espectador es requerido" });
      return;
    }

    const historial = await prisma.jugadaRuleta.findMany({
      where: { id_espectador },
      orderBy: { fecha_hora: "desc" },
      take: 10,
    });

    resp.status(200).json(historial);
  } catch (error) {
    console.error("Error al obtener historial de ruleta:", error);
    resp.status(500).json({ error: "Error al obtener historial" });
  }
});

export default router;
