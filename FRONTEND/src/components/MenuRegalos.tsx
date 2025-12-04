// src/components/MenuRegalos.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import GiftOverlay from "@/pages/ventanas/GiftOverlay";
import { BACKEND_URL } from "@/config";
import { useSaldo } from "@/contexts/SaldoContext";

// 🎮 Mini-juego
import GiftGameModal from "@/components/GiftGameModal";

// 👇 Imágenes locales (ajusta la ruta si es distinta)
import tombaImg from "@/components/imagenes/tomba.png";
import dinaImg from "@/components/imagenes/Dina.png";

// Tipo que espera GiftOverlay (nombre + imagen)
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
  streamerId: string;
}

// Mapeo de nombre → imagen (para los que conoces)
const getGiftImage = (nombre: string): string => {
  const n = nombre.toLowerCase().trim();
  if (n.includes("tomba")) return tombaImg;
  if (n.includes("dina")) return dinaImg;
  // 👉 placeholder genérico (puedes cambiarla por otra ruta)
  return tombaImg;
};

export default function MenuRegalos({ streamerId }: MenuRegalosProps) {
  const { saldo, setSaldo, refrescarSaldo } = useSaldo();

  const [openGifts, setGifts] = useState(false);
  const [dialogActivo, setDialogActivo] = useState<"principal" | "detalle">(
    "principal"
  );
  const [mensaje, setMensaje] = useState("");
  const [regalos, setRegalos] = useState<Regalo[]>([]);
  const [regaloSeleccionado, setRegaloSeleccionado] = useState<Regalo | null>(
    null
  );

  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayGift, setOverlayGift] = useState<GiftInfo | null>(null);

  // 🎮 estado del minijuego
  const [gameOpen, setGameOpen] = useState(false);

  // ============================
  //   Cargar regalos del streamer
  // ============================
  useEffect(() => {
    const cargarRegalos = async () => {
      if (!streamerId) return;

      try {
        const resp = await fetch(
          `${BACKEND_URL}/regalos/streamer/${streamerId}`
        );

        if (!resp.ok) {
          console.warn(
            "No se pudo obtener regalos del streamer",
            resp.status,
            await resp.text()
          );
          return;
        }

        const data = (await resp.json()) as Regalo[];
        setRegalos(data || []);
      } catch (error) {
        console.error("Error al cargar regalos:", error);
      }
    };

    cargarRegalos();
  }, [streamerId]);

  // ============================
  //   Enviar regalo (backend)
  //   AHORA SOPORTA MULTIPLICADOR
  // ============================
  const handleEnviarRegalo = async (
    regalo: Regalo,
    multiplicador: number = 1
  ) => {
    setMensaje("");

    const rawUsuario = localStorage.getItem("usuario");
    if (!rawUsuario) {
      setMensaje("Debes iniciar sesión para enviar regalos.");
      return;
    }

    let usuario: any;
    try {
      usuario = JSON.parse(rawUsuario);
    } catch (e) {
      console.error("Error parseando usuario:", e);
      setMensaje("Error con los datos de sesión. Vuelve a iniciar sesión.");
      return;
    }

    const id_espectador = usuario.id_usuario ?? usuario.id;
    if (!id_espectador) {
      setMensaje("No se encontró tu ID de usuario. Vuelve a iniciar sesión.");
      return;
    }

    // Validar saldo con el costo base * multiplicador
    const costoTotal = regalo.costo_monedas * multiplicador;
    if (saldo < costoTotal) {
      setMensaje(
        `No tienes suficientes monedas. Necesitas ${costoTotal} monedas.`
      );
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
          cantidad: multiplicador, // 👈 aquí aplicamos el multiplicador
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        console.error("Error /regalos/enviar:", data);
        setMensaje(data.error || "Error al enviar el regalo.");
        await refrescarSaldo();
        return;
      }

      // Actualizar saldo desde respuesta
      if (typeof data.saldo_monedas === "number") {
        setSaldo(data.saldo_monedas);
      } else {
        await refrescarSaldo();
      }

      // 👇 Ahora sí: nombre + imagen
      setOverlayGift({
        nombre:
          multiplicador > 1
            ? `${regalo.nombre} x${multiplicador}`
            : regalo.nombre,
        imagen: getGiftImage(regalo.nombre),
      });
      setOverlayVisible(true);

      setMensaje(
        multiplicador > 1
          ? `¡Regalo enviado con multiplicador x${multiplicador}! 🎁`
          : "¡Regalo enviado correctamente! 🎁"
      );
    } catch (error) {
      console.error("Error al enviar regalo:", error);
      setMensaje("Error de conexión al enviar el regalo.");
    }
  };

  const handleSeleccionarRegalo = (regalo: Regalo) => {
    setRegaloSeleccionado(regalo);
    setMensaje("");
    setDialogActivo("detalle");
  };

  const handleVolverPrincipal = () => {
    setDialogActivo("principal");
    setRegaloSeleccionado(null);
    setMensaje("");
  };

  return (
    <div>
      {/* Botón flotante para abrir menú de regalos */}
      <button
        className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold px-4 py-2 rounded-xl shadow-md transition"
        onClick={() => setGifts(true)}
        title="Enviar regalo"
      >
        🎁
      </button>

      <Dialog open={openGifts} onOpenChange={setGifts}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="border-b-2 border-white pb-2 mb-4 flex items-center justify-between">
              <h1 className="text-pink-600 text-3xl font-bold">Regalos</h1>

              <div className="text-right">
                <h1 className="text-muted-foreground text-xs">Saldo</h1>
                <h1 className="text-2xl font-bold">{saldo} MONEDAS</h1>
              </div>
            </div>

            {/* Vista principal */}
            {dialogActivo === "principal" && (
              <div className="relative flex flex-wrap justify-start items-start gap-4 min-h-[160px]">
                {regalos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Este streamer aún no tiene regalos configurados.
                  </p>
                ) : (
                  regalos.map((regalo) => (
                    <button
                      key={regalo.id_regalo}
                      onClick={() => handleSeleccionarRegalo(regalo)}
                      className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg bg-card hover:bg-card/80 transition border border-white/10"
                    >
                      <Gift className="w-6 h-6 text-pink-500" />
                      <span className="text-xs font-semibold">
                        {regalo.nombre}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {regalo.costo_monedas} monedas
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Mensajes de feedback */}
            {mensaje && (
              <div className="max-w-xl mx-auto mt-3 mb-1 text-center text-primary font-semibold text-sm">
                {mensaje}
              </div>
            )}

            {/* Detalle regalo */}
            {dialogActivo === "detalle" && regaloSeleccionado && (
              <div className="max-w-md mx-auto bg-card rounded-xl p-6 text-center">
                <h3 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />{" "}
                  {regaloSeleccionado.nombre}
                </h3>

                <p className="text-sm mb-1">
                  Costo:{" "}
                  <span className="font-semibold">
                    {regaloSeleccionado.costo_monedas} monedas
                  </span>
                </p>
                <p className="text-sm mb-4">
                  Puntos:{" "}
                  <span className="font-semibold">
                    {regaloSeleccionado.puntos_otorgados}
                  </span>
                </p>

                <div className="flex flex-col gap-3 mt-4">
                  {/* Botón que abre el minijuego */}
                  <Button
                    variant="secondary"
                    onClick={() => setGameOpen(true)}
                  >
                    Jugar minijuego y enviar
                  </Button>

                  {/* Si quisieras, podrías dejar un botón clásico sin juego:
                  <Button
                    variant="outline"
                    onClick={() => handleEnviarRegalo(regaloSeleccionado, 1)}
                  >
                    Enviar sin minijuego
                  </Button>
                  */}

                  <Button variant="outline" onClick={handleVolverPrincipal}>
                    Volver
                  </Button>
                </div>
              </div>
            )}
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Overlay animado, ahora con nombre + imagen */}
      <GiftOverlay
        gift={overlayGift}
        visible={overlayVisible}
        onClose={() => setOverlayVisible(false)}
      />

      {/* 🎮 Modal del minijuego */}
      <GiftGameModal
        open={gameOpen}
        gift={regaloSeleccionado}
        onClose={() => setGameOpen(false)}
        onResult={async (mult) => {
          setGameOpen(false);
          if (!regaloSeleccionado) return;
          await handleEnviarRegalo(regaloSeleccionado, mult);
        }}
      />
    </div>
  );
}
