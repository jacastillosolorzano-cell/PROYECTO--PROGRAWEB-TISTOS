// src/components/LogoutButton.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { BACKEND_URL } from "@/config";
import { useSaldo } from "@/contexts/SaldoContext";

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { setSaldo } = useSaldo();

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");

      // Llamada al backend para que salga en Network
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      // Limpiar sesión en el navegador
      localStorage.removeItem("authToken");
      localStorage.removeItem("usuario");

      setSaldo(0); // Reiniciar saldo en el contexto
      
      navigate("/login");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={loading}
      className="justify-start w-full px-6 py-4 text-left text-red-500 hover:text-red-400 hover:bg-red-500/10"
    >
      <LogOut className="w-5 h-5 mr-2" />
      {loading ? "Cerrando sesión..." : "Cerrar sesión"}
    </Button>
  );
};

export default LogoutButton;
