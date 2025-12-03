import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";

// Imágenes locales
import tomba from "@/components/imagenes/tomba.png";
import dina from "@/components/imagenes/Dina.png";

// Overlay animado
import GiftOverlay from "./GiftOverlay";

export default function MenuRegalos() {
  const [dialogActivo, setDialogActivo] = useState("principal");
  const [mensaje, setMensaje] = useState("");
  const [monedas, setMonedas] = useState(100); // <--- SALDO HARDCODEADO ORIGINAL
  const [RegaloSeleccionado, setRegaloSeleccionado] = useState<any>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayGift, setOverlayGift] = useState<any>(null);
  const [openGifts, setGifts] = useState(false);

  // Regalos estáticos (versión original)
  const regalosDisponibles = [
    {
      id: 1,
      nombre: "Tomba",
      costo: 2,
      puntos: 20,
      imagen: tomba,
      descripcion: "Para que nunca te falte el pasaje",
      ancho: 100,
      alto: 100,
    },
    {
      id: 2,
      nombre: "Dina",
      costo: 10,
      puntos: 100,
      imagen: dina,
      descripcion: "Para tu sopa, segundo y postrecito",
      ancho: 150,
      alto: 75,
    },
  ];

  // Enviar regalo (solo frontend)
  const handleEnviarRegalo = (regalo: any) => {
    if (monedas < regalo.costo) {
      setMensaje("No tienes suficientes monedas");
      return;
    }

    // Restar monedas en frontend
    setMonedas((prev) => prev - regalo.costo);

    // Mostrar overlay animado
    setOverlayGift(regalo);
    setOverlayVisible(true);

    setMensaje("¡Regalo enviado!");
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
                <h1 className="text-2xl font-bold">{monedas} MONEDAS</h1>
              </div>
            </div>

            {/* Vista principal */}
            {dialogActivo === "principal" && (
              <div className="relative flex justify-start items-start gap-6 min-h-[200px]">
                {regalosDisponibles.map((regalo) => (
                  <button
                    key={regalo.id}
                    onClick={() => {
                      setRegaloSeleccionado(regalo);
                      setDialogActivo("dialogo2");
                    }}
                    className="hover:scale-105 transition"
                  >
                    <img src={regalo.imagen} className="w-10 h-10 object-contain" />
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
            {dialogActivo === "dialogo2" && RegaloSeleccionado && (
              <div className="max-w-md mx-auto bg-card rounded-xl p-6 text-center">
                <h3 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
                  <Gift className="w-5 h-5 text-primary" /> {RegaloSeleccionado.nombre}
                </h3>

                <img
                  src={RegaloSeleccionado.imagen}
                  style={{
                    width: RegaloSeleccionado.ancho,
                    height: RegaloSeleccionado.alto,
                    objectFit: "contain",
                    margin: "0 auto",
                  }}
                  className="mb-4"
                />

                <p className="text-sm mb-1">Costo: {RegaloSeleccionado.costo}</p>
                <p className="text-sm mb-1">Puntos: {RegaloSeleccionado.puntos}</p>
                <p className="text-sm mb-4">{RegaloSeleccionado.descripcion}</p>

                <div className="flex justify-center gap-4">
                  <Button variant="secondary" onClick={() => handleEnviarRegalo(RegaloSeleccionado)}>
                    Enviar regalo
                  </Button>

                  <Button variant="outline" onClick={() => setDialogActivo("principal")}>
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
        gift={overlayGift ? { nombre: overlayGift.nombre, imagen: overlayGift.imagen } : null}
        visible={overlayVisible}
        onClose={() => setOverlayVisible(false)}
      />
    </div>
  );
}
