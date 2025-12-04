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

    // Crear JWT
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" } // 1 día, puedes ajustarlo
    );

    // Devolvemos el mismo objeto de antes + token (backward compatible)
    return resp.status(200).json({
      ...usuarioSeguro,
      token,
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return resp.status(500).json({ error: "Error al iniciar sesión" });
  }
};

// Handler reutilizable para logout
export const logoutHandler = (_req: Request, resp: Response) => {
  // Con JWT stateless no hay nada que invalidar en servidor
  return resp.status(200).json({ message: "Sesión cerrada correctamente" });
};

// Rutas bajo /auth
router.post("/login", loginHandler);
router.post("/logout", logoutHandler);

export default router;
