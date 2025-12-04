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

    const progresos = await prisma.progresoEspectador.findMany({
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

    resp.status(200).json(progresos);
  } catch (error) {
    console.error("Error al obtener progreso:", error);
    resp.status(500).json({ error: "Error al obtener progreso" });
  }
});

export default router;