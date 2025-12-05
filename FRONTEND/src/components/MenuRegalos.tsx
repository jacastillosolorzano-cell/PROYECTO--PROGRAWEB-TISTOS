// src/components/MenuRegalos.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import GiftOverlay from "@/pages/ventanas/GiftOverlay";
import { BACKEND_URL } from "@/config";
import { useSaldo } from "@/contexts/SaldoContext";

import GiftGameModal from "@/components/GiftModal";

import tombaImg from "@/components/imagenes/tomba.png";
import dinaImg from "@/components/imagenes/Dina.png";

import { io } from "socket.io-client";
const socket = io(BACKEND_URL, { transports: ["websocket"] });

type GiftInfo = {
  nombre: string;
  imagen: string;
};

type Regalo = {
  id_regalo: string;
  nombre: string;
  costo_monedas: number;
  puntos_otorgados: number;
};

interface MenuRegalosProps {
  streamerId: string; // video.streamerId proveniente del VideoCard
  sessionId?: string; // ID del stream en vivo
}

const getGiftImage = (nombre: string): string => {
  const n = nombre.toLowerCase().trim();
  if (n.includes("tomba")) return tombaImg;
  if (n.includes("dina")) return dinaImg;
  return tombaImg || dinaImg; 
};

export default function MenuRegalos({ streamerId, sessionId }: MenuRegalosProps) {
  const { saldo, setSaldo, refrescarSaldo } = useSaldo();

  const [openGifts, setGifts] = useState(false);
  const [dialogActivo, setDialogActivo] = useState<"principal" | "detalle">("principal");
  const [mensaje, setMensaje] = useState("");
  const [regalos, setRegalos] = useState<Regalo[]>([]);
  const [regaloSeleccionado, setRegaloSeleccionado] = useState<Regalo | null>(null);

  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayGift, setOverlayGift] = useState<GiftInfo | null>(null);

  const [gameOpen, setGameOpen] = useState(false);

  // ============================
  // 🔥 Obtener catálogo de regalos
  // ============================
  useEffect(() => {
    const cargarRegalos = async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/regalos`);
        const data = await resp.json();
        setRegalos(data || []);
      } catch (err) {
        console.error("Error obteniendo regalos:", err);
      }
    };
    cargarRegalos();
  }, []);

  // ============================
  // 🔥 ENVIAR REGALO (con socket)
  // ============================
  const handleEnviarRegalo = async (regalo: Regalo, multiplicador = 1) => {
    setMensaje("");

    const rawUsuario = localStorage.getItem("usuario");
    if (!rawUsuario) {
      setMensaje("Debes iniciar sesión.");
      return;
    }

    const usuario = JSON.parse(rawUsuario);
    const id_espectador = usuario.id_usuario;

    const costoTotal = regalo.costo_monedas * multiplicador;

    if (saldo < costoTotal) {
      setMensaje(`Te faltan monedas. Necesitas ${costoTotal}.`);
      return;
    }

    const token = localStorage.getItem("authToken");

    try {
      const resp = await fetch(`${BACKEND_URL}/regalos/enviar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id_espectador,
          id_streamer: streamerId,
          id_regalo: regalo.id_regalo,
          cantidad: multiplicador,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setMensaje(data.error || "Error enviando regalo.");
        await refrescarSaldo();
        return;
      }

      // Actualizar saldo
      if (typeof data.saldo_monedas === "number") {
        setSaldo(data.saldo_monedas);
      }

      // ============================
      // 🎁 1) Mostrar overlay local
      // ============================
      setOverlayGift({
        nombre: multiplicador > 1 ? `${regalo.nombre} x${multiplicador}` : regalo.nombre,
        imagen: getGiftImage(regalo.nombre),
      });
      setOverlayVisible(true);

      // ============================
      // 🎁 2) Emitir al STREAMER en tiempo real
      // ============================
      socket.emit("gift:send", {
        streamId: sessionId,
        streamerId,
        regalo: regalo.nombre,
        multiplicador,
        puntos: regalo.puntos_otorgados * multiplicador,
        imagen: getGiftImage(regalo.nombre),
        fromUser: usuario.nombre,
      });

      setMensaje("🎁 ¡Regalo enviado!");
    } catch (e) {
      console.error("Error al enviar regalo:", e);
      setMensaje("Error de conexión.");
    }
  };

  // ============================
  //  UI DE REGALOS
  // ============================
  const handleSeleccionarRegalo = (regalo: Regalo) => {
    setRegaloSeleccionado(regalo);
    setDialogActivo("detalle");
  };

  return (
    <div>
      {/* Botón flotante */}
      <button
        className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold px-4 py-2 rounded-xl shadow-md"
        onClick={() => setGifts(true)}
      >
        🎁
      </button>

      <Dialog open={openGifts} onOpenChange={setGifts}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="border-b pb-2 mb-4 flex justify-between">
              <h1 className="text-pink-600 text-3xl font-bold">Regalos</h1>
              <div>
                <p className="text-muted-foreground text-xs">Saldo</p>
                <p className="text-xl font-bold">{saldo} monedas</p>
              </div>
            </div>

            {/* 🎁 Lista de regalos */}
            {dialogActivo === "principal" && (
              <div className="grid grid-cols-2 gap-4">
                {regalos.map((r) => (
                  <button
                    key={r.id_regalo}
                    className="bg-card p-3 rounded-xl flex flex-col items-center hover:bg-card/80 transition"
                    onClick={() => handleSeleccionarRegalo(r)}
                  >
                    <img src={getGiftImage(r.nombre)} className="w-12 h-12 mb-1" />
                    <p className="font-bold text-sm">{r.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      💰 {r.costo_monedas} | ⭐ {r.puntos_otorgados}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* 🎁 detalle regalo */}
            {dialogActivo === "detalle" && regaloSeleccionado && (
              <div className="text-center">
                <img
                  src={getGiftImage(regaloSeleccionado.nombre)}
                  className="w-20 h-20 mx-auto mb-2"
                />

                <h3 className="font-bold text-xl">{regaloSeleccionado.nombre}</h3>
                <p>Costo: {regaloSeleccionado.costo_monedas} monedas</p>
                <p>Puntos al streamer: {regaloSeleccionado.puntos_otorgados}</p>

                <div className="mt-4 flex flex-col gap-2">
                  <Button onClick={() => setGameOpen(true)}>🎮 Enviar con minijuego</Button>

                  <Button
                    variant="outline"
                    onClick={() => handleEnviarRegalo(regaloSeleccionado, 1)}
                  >
                    Enviar ahora
                  </Button>

                  <Button variant="ghost" onClick={() => setDialogActivo("principal")}>
                    Volver
                  </Button>
                </div>
              </div>
            )}

            {mensaje && <p className="text-center text-sm text-primary mt-2">{mensaje}</p>}
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <GiftOverlay
        gift={overlayGift}
        visible={overlayVisible}
        onClose={() => setOverlayVisible(false)}
      />
    </div>
  );
}
