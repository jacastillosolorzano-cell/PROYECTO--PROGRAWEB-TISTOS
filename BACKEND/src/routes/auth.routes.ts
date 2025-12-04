// src/routes/auth.routes.ts
import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client.js";

const router = Router();

// Handler reutilizable para login
export const loginHandler = async (req: Request, resp: Response) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return resp
        .status(400)
        .json({ error: "Correo y contraseña son requeridos" });
    }

    const usuario = await prisma.usuario.findFirst({
      where: { email: correo },
    });

    if (!usuario) {
      return resp.status(401).json({ error: "Credenciales inválidas" });
    }

    const contrasenaValida = await bcrypt.compare(
      contrasena,
      usuario.contrasena_hash
    );

    if (!contrasenaValida) {
      return resp.status(401).json({ error: "Credenciales inválidas" });
    }

    const { contrasena_hash: _, ...usuarioSeguro } = usuario as any;

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("Falta JWT_SECRET en .env");
      return resp.status(500).json({ error: "Config de servidor incompleta" });
    }

    // Crear JWT
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        rol: usuario.rol,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 🔴 AQUÍ EL CAMBIO IMPORTANTE
    return resp.status(200).json({
      token,
      usuario: usuarioSeguro,  // 👉 objeto completo
      ...usuarioSeguro,        // opcional: para compatibilidad con código viejo
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return resp.status(500).json({ error: "Error al iniciar sesión" });
  }
};

// Handler reutilizable para logout
export const logoutHandler = (_req: Request, resp: Response) => {
  return resp.status(200).json({ message: "Sesión cerrada correctamente" });
};

// Rutas bajo /auth
router.post("/login", loginHandler);
router.post("/logout", logoutHandler);

export default router;
