// src/utils/niveles.ts
import { prisma } from "../prisma/client.js";

// Recalcula el nivel de espectador para un streamer según sus puntos
export async function recalcularNivelEspectador(
  id_espectador: string,
  id_streamer: string
) {
  const progreso = await prisma.progresoEspectador.findFirst({
    where: { id_espectador, id_streamer },
    include: {
      nivel: true,
      streamer: {
        select: {
          id_usuario: true,
          nombre: true,
        },
      },
    },
  });

  if (!progreso) return;

  const niveles = await prisma.nivelEspectador.findMany({
    where: {
      id_streamer,
      activo: true,
    },
    orderBy: { orden: "asc" },
  });

  if (!niveles.length) return;

  const puntos = progreso.puntos_actuales;

  // Elegimos el nivel de mayor orden cuyo puntos_requeridos <= puntos
  let nuevoNivel = niveles[0];
  for (const n of niveles) {
    if (puntos >= n.puntos_requeridos && n.orden >= nuevoNivel.orden) {
      nuevoNivel = n;
    }
  }

  const nivelAnteriorId = progreso.id_nivel_espectador;

  if (nivelAnteriorId !== nuevoNivel.id_nivel_espectador) {
    // Actualizar el progreso con el nuevo nivel
    await prisma.progresoEspectador.update({
      where: { id_progreso: progreso.id_progreso },
      data: { id_nivel_espectador: nuevoNivel.id_nivel_espectador },
    });

    // Crear notificación de nivel de espectador subido
    await prisma.notificacion.create({
      data: {
        id_usuario: id_espectador,
        tipo: "NIVEL_ESPECTADOR_SUBIDO",
        mensaje: `¡Has subido al nivel "${nuevoNivel.nombre_nivel}" con el streamer ${progreso.streamer.nombre}!`,
      },
    });
  }
}

// Recalcula el nivel de streamer según sus horas transmitidas totales (en minutos)
export async function recalcularNivelStreamer(id_streamer: string) {
  const perfil = await prisma.perfilStreamer.findUnique({
    where: { id_usuario: id_streamer },
    include: {
      nivel: true,
      usuario: {
        select: { nombre: true },
      },
    },
  });

  if (!perfil) return;

  const niveles = await prisma.nivelStreamer.findMany({
    orderBy: { orden: "asc" },
  });

  if (!niveles.length) return;

  const totalMinutos = perfil.horas_transmitidas_total;
  let nuevoNivel = niveles[0];

  for (const n of niveles) {
    const requeridosMin = n.horas_requeridas * 60;
    if (totalMinutos >= requeridosMin && n.orden >= nuevoNivel.orden) {
      nuevoNivel = n;
    }
  }

  const nivelAnteriorId = perfil.id_nivel_streamer;

  if (nivelAnteriorId !== nuevoNivel.id_nivel_streamer) {
    await prisma.perfilStreamer.update({
      where: { id_usuario: id_streamer },
      data: { id_nivel_streamer: nuevoNivel.id_nivel_streamer },
    });

    await prisma.notificacion.create({
      data: {
        id_usuario: id_streamer,
        tipo: "NIVEL_STREAMER_SUBIDO",
        mensaje: `¡Has subido al nivel "${nuevoNivel.nombre_nivel}" como streamer!`,
      },
    });
  }
}
