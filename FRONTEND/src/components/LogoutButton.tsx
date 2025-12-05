// Ejemplo de botón de logout

import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "@/config";
import { Button } from "@/components/ui/button";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const token = localStorage.getItem("authToken");

    try {
      // 👉 Esto es lo que vas a ver en Network como POST /auth/logout
      const resp = await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await resp.json().catch(() => null);

    } catch (e) {
      console.error("Error llamando a /auth/logout:", e);
      
    } finally {
      // Limpiar sesión en el navegador
      localStorage.removeItem("authToken");
      localStorage.removeItem("usuario");

      // Redirigir al login
      navigate("/login");
    }
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      Cerrar sesión
    </Button>
  );
};

export default LogoutButton;
