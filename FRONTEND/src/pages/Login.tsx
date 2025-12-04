import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video } from "lucide-react";
import { BACKEND_URL } from "../config";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const resp = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: email,
          contrasena: password,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || "Correo y/o contraseña incorrectos");
        return;
      }

      // 👇 El backend debe devolver algo como:
      // { token: "...", usuario: { id_usuario, email, rol, ... } }
      const { token, usuario } = data;

      if (!token || !usuario) {
        setError("Respuesta de login inválida del servidor");
        return;
      }

      // ✅ Guardar token de auth para usarlo en /regalos, /notificaciones, etc.
      localStorage.setItem("authToken", token);

      // ✅ Guardar usuario completo (ya sin password) para usarlo en toda la app
      localStorage.setItem("usuario", JSON.stringify(usuario));

      // Inicializar perfil de espectador en backend
      try {
        await fetch(
          `${BACKEND_URL}/usuarios/${usuario.id_usuario}/inicializar-perfil`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Si más adelante protegemos esta ruta, ya tienes el token
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (perfil_error) {
        console.error("Error al inicializar perfil:", perfil_error);
      }

      // (Opcional) log de rol
      if (usuario.rol !== "STREAMER") {
        console.warn(
          "El usuario no es streamer. Solo podrá ver transmisiones."
        );
      }

      setError("");
      navigate("/index");
    } catch (error) {
      console.error(error);
      setError("Error al conectar con el servidor");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Video className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold gradient-primary bg-clip-text">
              Tistos
            </h1>
          </div>
          <p className="text-muted-foreground">Inicia sesión para continuar</p>
        </div>

        <div className="glassmorphism p-8 rounded-2xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                placeholder="tistos@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <Button type="submit" className="w-full">
              Iniciar sesión
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            No tienes una cuenta?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Regístrate
            </Link>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4 text-sm text-muted-foreground">
          <Link to="/about" className="hover:text-primary transition-colors">
            Nosotros
          </Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-primary transition-colors">
            Términos y condiciones
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
