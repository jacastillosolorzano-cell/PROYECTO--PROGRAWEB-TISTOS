// src/routes/usuarios.routes.ts
import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma, PrismaClientKnownRequestError } from "../prisma/client.js";

const router = Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);

// Crear usuario
router.post("/crear", async (req: Request, resp: Response) => {
  try {
    const data = req.body;

    if (!data.nombre || !data.email || !data.contra) {
      return resp
        .status(400)
        .json({ error: "Nombre, email y contraseña son requeridos" });
    }

    const contrasena_hash = await bcrypt.hash(data.contra, BCRYPT_ROUNDS);

    const usuario = await prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        contrasena_hash,
        rol: data.rol || "ESPECTADOR",
        fecha_registro: new Date(),
        estado: "ACTIVO",
      },
    });

    const { contrasena_hash: _, ...usuarioSeguro } = usuario as any;
    resp.status(200).json(usuarioSeguro);
  } catch (error: any) {
    const prismaError = error as PrismaClientKnownRequestError;

    if (prismaError.code === "P2002") {
      resp.status(400).json({ error: "El email ya está registrado" });
    } else {
      console.error("Error al crear usuario:", error);
      resp.status(500).json({ error: "Error al crear usuario" });
    }
  }
});

router.get(
  "/:id_usuario/perfil-streamer",
  async (req, resp: Response) => {
    try {
      const { id_usuario } = req.params;

      const perfil = await prisma.perfilStreamer.findUnique({
        where: { id_usuario },
        include: { nivel: true },
      });

      if (!perfil) {
        // Si aún no tiene perfil de streamer, devolvemos valores por defecto
        return resp.status(200).json({
          horas_transmitidas_total: 0,
          nivel: null,
        });
      }

      return resp.status(200).json({
        horas_transmitidas_total: perfil.horas_transmitidas_total,
        nivel: perfil.nivel, // { nombre_nivel, orden, horas_requeridas, ... }
      });
    } catch (error) {
      console.error("Error al obtener perfil streamer:", error);
      return resp
        .status(500)
        .json({ error: "Error al obtener perfil de streamer" });
    }
  }
);

// Obtener usuario por id
router.get("/:id_usuario", async (req: Request, resp: Response) => {
  try {
    const { id_usuario } = req.params;
    if (!id_usuario) {
      return resp.status(400).json({ error: "id_usuario es requerido" });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id_usuario } });
    if (!usuario) {
      return resp.status(404).json({ error: "Usuario no encontrado" });
    }

    const { contrasena_hash: _, ...usuarioSeguro } = usuario as any;
    resp.status(200).json(usuarioSeguro);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    resp.status(500).json({ error: "Error al obtener usuario" });
  }
});

// Cambiar rol
router.put("/:id_usuario/rol", async (req: Request, resp: Response) => {
  try {
    const { id_usuario } = req.params;
    const { rol } = req.body;

    if (!id_usuario || !rol) {
      return resp
        .status(400)
        .json({ error: "id_usuario y rol son requeridos" });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id_usuario } });
    if (!usuario) {
      return resp.status(404).json({ error: "Usuario no encontrado" });
    }

    const actualizado = await prisma.usuario.update({
      where: { id_usuario },
      data: { rol },
    });

    const { contrasena_hash: _, ...usuarioSeguro } = actualizado as any;
    resp.status(200).json(usuarioSeguro);
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    resp.status(500).json({ error: "Error al actualizar rol" });
  }
});

// Inicializar perfil espectador
router.post("/:id_usuario/inicializar-perfil", async (req: Request, resp: Response) => {
  try {
    const { id_usuario } = req.params;

    const usuario = await prisma.usuario.findUnique({ where: { id_usuario } });
    if (!usuario) {
      return resp.status(404).json({ error: "Usuario no encontrado" });
    }

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

    resp.status(200).json({ message: "Perfil listo", perfil });
  } catch (error) {
    console.error("Error al inicializar perfil:", error);
    resp.status(500).json({ error: "Error al inicializar perfil" });
  }
});

// Obtener progreso del espectador
router.get("/:id_usuario/progreso", async (req: Request, resp: Response) => {
  try {
    const { id_usuario } = req.params;

    // Obtener todos los progresos del espectador con información de nivel y streamer
    const progresosRaw = await prisma.progresoEspectador.findMany({
      where: { id_espectador: id_usuario },
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

    // Enriquecer cada progreso con información del siguiente nivel y puntos faltantes
    const enriched = [] as any[];
    for (const prog of progresosRaw) {
      const id_streamer = prog.id_streamer;
      let nextLevelName: string | null = null;
      let nextLevelPoints: number | null = null;
      let puntosFaltantes: number | null = null;
      const nivelActualNombre: string | null = prog.nivel?.nombre_nivel ?? null;
      try {
        // Obtener niveles activos del streamer ordenados de menor a mayor
        const niveles = await prisma.nivelEspectador.findMany({
          where: { id_streamer, activo: true },
          orderBy: { orden: "asc" },
        });
        const currentOrder = prog.nivel?.orden ?? 0;
        const next = niveles.find((n) => n.orden > currentOrder);
        if (next) {
          nextLevelName = next.nombre_nivel;
          nextLevelPoints = next.puntos_requeridos;
          puntosFaltantes = Math.max(next.puntos_requeridos - prog.puntos_actuales, 0);
        }
      } catch (innerErr) {
        console.error("Error al calcular siguiente nivel en progreso:", innerErr);
      }
      enriched.push({
        ...prog,
        nivel_actual: nivelActualNombre,
        nivel_siguiente: nextLevelName,
        puntos_para_siguiente: nextLevelPoints,
        puntos_faltantes: puntosFaltantes,
      });
    }
    resp.status(200).json(enriched);
  } catch (error) {
    console.error("Error al obtener progreso:", error);
    resp.status(500).json({ error: "Error al obtener progreso" });
  }
});


/// =========================================================
//  NUEVO: Endpoint para registrar mensaje y sumar puntos
//  (Soluciona el error 404 en ChatView)
// =========================================================
router.post("/:id_usuario/mensaje", async (req: Request, resp: Response) => {
  try {
    const { id_usuario } = req.params;
    const { id_streamer } = req.body; // Puede ser null si es un chat genérico

    // Buscamos si el usuario tiene progreso (con ese streamer o cualquiera)
    const progreso = await prisma.progresoEspectador.findFirst({
      where: {
        id_espectador: id_usuario,
        ...(id_streamer ? { id_streamer } : {}),
      },
    });

    if (progreso) {
      // Sumamos 1 punto
      const actualizado = await prisma.progresoEspectador.update({
        where: { id_progreso: progreso.id_progreso },
        data: { puntos_actuales: { increment: 1 } },
      });
      return resp.status(200).json({ ok: true, puntos: actualizado.puntos_actuales });
    }

    // Si no tiene progreso, igual respondemos 200 para que no de error en el chat
    return resp.status(200).json({ ok: true, message: "Mensaje enviado" });
  } catch (error) {
    console.error("Error al registrar mensaje:", error);
    return resp.status(500).json({ error: "Error interno al registrar mensaje" });
  }
});

// ================================================================
//  Obtener los puntos faltantes para que un espectador suba al siguiente nivel
//  GET /usuarios/:id_usuario/faltan-puntos/:id_streamer
//  Devuelve el nivel actual, el siguiente nivel y la cantidad de puntos que faltan
// ================================================================
router.get(
  "/:id_usuario/faltan-puntos/:id_streamer",
  async (req: Request, resp: Response) => {
    try {
      const { id_usuario, id_streamer } = req.params;

      if (!id_usuario || !id_streamer) {
        return resp
          .status(400)
          .json({ error: "id_usuario e id_streamer son requeridos" });
      }

      // Obtener el progreso actual del espectador con el streamer
      const progreso = await prisma.progresoEspectador.findFirst({
        where: { id_espectador: id_usuario, id_streamer },
        include: { nivel: true },
      });

      if (!progreso) {
        return resp
          .status(404)
          .json({ error: "Progreso no encontrado para este espectador" });
      }

      // Obtener los niveles activos del streamer ordenados por orden ascendente
      const niveles = await prisma.nivelEspectador.findMany({
        where: { id_streamer, activo: true },
        orderBy: { orden: "asc" },
      });

      // Determinar el orden actual y el siguiente nivel
      const currentOrder = progreso.nivel?.orden ?? 0;
      const nextLevel = niveles.find((n) => n.orden > currentOrder);

      // Calcular puntos faltantes
      let faltantes = 0;
      if (nextLevel) {
        faltantes = nextLevel.puntos_requeridos - progreso.puntos_actuales;
        if (faltantes < 0) faltantes = 0;
      }

      return resp.status(200).json({
        puntos_actuales: progreso.puntos_actuales,
        nivel_actual: progreso.nivel?.nombre_nivel ?? null,
        nivel_siguiente: nextLevel?.nombre_nivel ?? null,
        puntos_para_siguiente: nextLevel?.puntos_requeridos ?? null,
        puntos_faltantes: faltantes,
      });
    } catch (error) {
      console.error("Error al calcular puntos faltantes:", error);
      return resp
        .status(500)
        .json({ error: "Error al calcular puntos faltantes" });
    }
  }
);

export default router;