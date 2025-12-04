import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { BACKEND_URL } from "../config";

const Register = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !email || !password) {
      setError("Completa todos los campos");
      return;
    }

    try {
      // 1) Crear usuario
      const resp = await fetch(`${BACKEND_URL}/usuarios/crear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          email,
          contra: password,
          rol: "ESPECTADOR",
          estado: "ACTIVO",
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || "Error al registrarse");
        return;
      }

      const usuarioCreado = data;

      // 2) Loguear automáticamente al nuevo usuario para obtener token
      const loginResp = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: email,
          contrasena: password,
        }),
      });

      const loginData = await loginResp.json();

      if (!loginResp.ok) {
        // Si falla el login automático, al menos dejamos creado el usuario
        toast.success("Usuario creado. Inicia sesión para continuar.");
        setError("");
        navigate("/login");
        return;
      }

      const { token, usuario } = loginData;

      if (!token || !usuario) {
        toast.success("Usuario creado. Inicia sesión para continuar.");
        setError("");
        navigate("/login");
        return;
      }

      // 3) Guardar authToken y usuario en localStorage
      localStorage.setItem("authToken", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      // 4) Inicializar perfil de espectador
      try {
        await fetch(
          `${BACKEND_URL}/usuarios/${usuario.id_usuario}/inicializar-perfil`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (perfil_error) {
        console.error("Error al inicializar perfil:", perfil_error);
      }

      toast.success("Cuenta creada e iniciada sesión correctamente");
      setError("");
      navigate("/index");
    } catch (error) {
      setError("Error al conectar con el servidor");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Botón de regresar */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Video className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold gradient-primary bg-clip-text">
              Tistos
            </h1>
          </div>
          <p className="text-muted-foreground">Crea tu cuenta</p>
        </div>

        <div className="glassmorphism p-8 rounded-2xl space-y-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                type="text"
                placeholder="nombre o usuario"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
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
              Registrarse
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
