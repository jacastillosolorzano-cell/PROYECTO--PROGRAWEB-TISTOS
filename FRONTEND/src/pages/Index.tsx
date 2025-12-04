import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VideoFeed from "@/components/VideoFeed";
import BottomNav from "@/components/BottomNav";
import HeaderSaldo from "@/components/HeaderSaldo";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Proteger la ruta: si no hay usuario en localStorage, mandar a login
    const rawUsuario = localStorage.getItem("usuario");
    if (!rawUsuario) {
      navigate("/login", { replace: true }); // 👈 evita que vuelva con "atrás"
      return;
    }

    // Si quisieras, acá podrías validar rol (por ejemplo, bloquear STREAMER):
    // const usuario = JSON.parse(rawUsuario);
    // if (usuario.rol === "STREAMER") {
    //   navigate("/studio", { replace: true });
    // }
  }, [navigate]);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Header con saldo / info de usuario */}
      <div className="p-4 flex justify-center">
        <HeaderSaldo />
      </div>

      {/* Lista de streams / contenido principal */}
      <VideoFeed />

      {/* Navegación inferior */}
      <BottomNav />
    </div>
  );
};

export default Index;
