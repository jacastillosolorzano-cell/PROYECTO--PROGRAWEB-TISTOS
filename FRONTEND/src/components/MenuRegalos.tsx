import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import GiftOverlay from "../pages/ventanas/GiftOverlay";
import tomba from "@/components/imagenes/tomba.png";
import dina from "@/components/imagenes/Dina.png";
import { BACKEND_URL } from "../config";
import { useSaldo } from "../contexts/SaldoContext";

interface MenuRegalosProps {
  streamerId: string; // id_usuario del streamer dueño del canal/stream
}

interface RegaloBackend {
  id_regalo: string;
  nombre: string;
  costo_monedas: number;
  puntos_otorgados: number;
  id_streamer: string;
}

interface RegaloUI extends RegaloBackend {
  imagen: string;
  descripcion: string;
  ancho: number;
  alto: number;
}

export default function MenuRegalos({ streamerId }: MenuRegalosProps) {
  const [dialogActivo, setDialogActivo] = useState<"principal" | "dialogo2">(
    "principal"
  );
  const [mensaje, setMensaje] = useState("");
  const [regalos, setRegalos] = useState<RegaloUI[]>([]);
  const [regaloSeleccionado, setRegaloSeleccionado] = useState<RegaloUI | null>(
    null
  );
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayGift, setOverlayGift] = useState<{ nombre: string; imagen: string } | null>(null);
  const [openGifts, setGifts] = useState(false);
  const [cargando, setCargando] = useState(false);

  const { saldo, setSaldo, refrescarSaldo } = useSaldo();

  // 1. Cargar regalos desde el backend
  useEffect(() => {
    const fetchRegalos = async () => {
      try {
        setCargando(true);

        const resp = await fetch(
          streamerId
            ? `${BACKEND_URL}/regalos/streamer/${streamerId}`
            : `${BACKEND_URL}/regalos`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!resp.ok) {
          console.error("Error al obtener regalos");
          return;
        }

        const data: RegaloBackend[] = await resp.json();

        // Mapear a formato UI (como antes, pero usando datos reales)
        const regalosUI: RegaloUI[] = data.map((r, index) => ({
          ...r,
          imagen: index % 2 === 0 ? tomba : dina, // alterna imágenes locales
          descripcion: `Regalo ${r.nombre} (+${r.puntos_otorgados} puntos)`,
          ancho: index % 2 === 0 ? 100 : 150,
          alto: index % 2 === 0 ? 100 : 75,
        }));

        setRegalos(regalosUI);
      } catch (error) {
        console.error("Error al cargar regalos:", error);
      } finally {
        setCargando(false);
      }
    };

    fetchRegalos();
  }, [streamerId]);

  // 2. Enviar regalo al backend
  const handleEnviarRegalo = async (regalo: RegaloUI) => {
    setMensaje("");

    // Validar saldo suficiente
    if (saldo < regalo.costo_monedas) {
      setMensaje("No tienes suficientes monedas");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setMensaje("Debes iniciar sesión para enviar regalos");
      return;
    }

    try {
      const resp = await fetch(`${BACKEND_URL}/regalos/enviar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_streamer: streamerId,
          id_regalo: regalo.id_regalo,
          cantidad: 1,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setMensaje(data.error || "Error al enviar regalo");
        return;
      }

      // Backend devuelve: { message, envio, saldo_monedas }
      if (typeof data.saldo_monedas === "number") {
        setSaldo(data.saldo_monedas);
      } else {
        // Si por algo no viene, refrescamos desde el backend
        await refrescarSaldo();
      }

      // Mostrar overlay animado
      setOverlayGift({ nombre: regalo.nombre, imagen: regalo.imagen });
      setOverlayVisible(true);

      setMensaje("¡Regalo enviado correctamente!");
      setDialogActivo("principal");
    } catch (error) {
      console.error("Error al enviar regalo:", error);
      setMensaje("Error al conectar con el servidor");
    }
  };

  return (
    <div>
      {/* Botón flotante para abrir regalos */}
      <button
        className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold px-4 py-2 rounded-xl shadow-md transition"
        onClick={() => setGifts(true)}
      >
        🎁
      </button>

      <Dialog open={openGifts} onOpenChange={setGifts}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="border-b-2 border-white pb-2 mb-4 flex items-center justify-between">
              <h1 className="text-pink-600 text-3xl font-bold">Regalos</h1>

              <div className="text-right">
                <h1 className="text-muted-foreground">Saldo</h1>
                <h1 className="text-2xl font-bold">{saldo} MONEDAS</h1>
              </div>
            </div>

            {/* Vista principal: lista de regalos */}
            {dialogActivo === "principal" && (
              <div className="relative flex justify-start items-start gap-6 min-h-[200px]">
                {cargando && <p className="text-sm text-muted-foreground">Cargando regalos...</p>}

                {!cargando && regalos.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay regalos configurados para este streamer.
                  </p>
                )}

                {!cargando &&
                  regalos.map((regalo) => (
                    <button
                      key={regalo.id_regalo}
                      onClick={() => {
                        setRegaloSeleccionado(regalo);
                        setDialogActivo("dialogo2");
                      }}
                      className="hover:scale-105 transition"
                    >
                      <img
                        src={regalo.imagen}
                        className="w-10 h-10 object-contain"
                      />
                    </button>
                  ))}
              </div>
            )}

            {/* Mensajes */}
            {mensaje && (
              <div className="max-w-xl mx-auto mb-2 text-center text-primary font-semibold">
                {mensaje}
              </div>
            )}

            {/* Dialog de detalles */}
            {dialogActivo === "dialogo2" && regaloSeleccionado && (
              <div className="max-w-md mx-auto bg-card rounded-xl p-6 text-center">
                <h3 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />{" "}
                  {regaloSeleccionado.nombre}
                </h3>

                <img
                  src={regaloSeleccionado.imagen}
                  style={{
                    width: regaloSeleccionado.ancho,
                    height: regaloSeleccionado.alto,
                    objectFit: "contain",
                    margin: "0 auto",
                  }}
                  className="mb-4"
                />

                <p className="text-sm mb-1">
                  Costo: {regaloSeleccionado.costo_monedas} monedas
                </p>
                <p className="text-sm mb-1">
                  Puntos: {regaloSeleccionado.puntos_otorgados}
                </p>
                <p className="text-sm mb-4">
                  {regaloSeleccionado.descripcion}
                </p>

                <div className="flex justify-center gap-4">
                  <Button
                    variant="secondary"
                    onClick={() => handleEnviarRegalo(regaloSeleccionado)}
                  >
                    Enviar regalo
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setDialogActivo("principal")}
                  >
                    Volver
                  </Button>
                </div>
              </div>
            )}
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Animación overlay */}
      <GiftOverlay
        gift={overlayGift}
        visible={overlayVisible}
        onClose={() => setOverlayVisible(false)}
      />
    </div>
  );
}
