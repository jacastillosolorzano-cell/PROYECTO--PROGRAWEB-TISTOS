
import { Button } from "@/components/ui/button";
import { Gift, Coins } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import tomba from "@/components/imagenes/tomba.png";
import dina from "@/components/imagenes/Dina.png";
import GiftOverlay from "./GiftOverlay";
import axios from "axios";


const BACKEND = import.meta.env.VITE_BACKEND_URL;


// Regalos fijos
const regalosDisponibles = [
  {
    id_regalo: "tomba",   // ID simbólico (no importa, backend usa id real)
    nombre: "Tomba",
    costo_monedas: 2,
    puntos_otorgados: 20,
    imagen: tomba,
    descripcion: "Para que nunca te falte el pasaje",
    ancho: 100,
    alto: 100,
  },
  {
    id_regalo: "dina",
    nombre: "Dina",
    costo_monedas: 10,
    puntos_otorgados: 100,
    imagen: dina,
    descripcion: "Para tu sopa, segundo y postrecito",
    ancho: 150,
    alto: 75,
  },
];


export default function MenuRegalos() {
  const [dialogActivo, setDialogActivo] = useState("principal");
  const [monedas, setMonedas] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [RegaloSeleccionado, setRegaloSeleccionado] = useState<any>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayGift, setOverlayGift] = useState<any>(null);
  const [openGifts, setGifts] = useState(false);


  const id_espectador = localStorage.getItem("id_usuario");
  const id_streamer = localStorage.getItem("streamer_actual"); // GUARDA ESTO AL ABRIR EL STREAM
  const id_sesion = localStorage.getItem("sesion_actual");     // GUARDA ESTO AL CREAR VIEWER


  // ===================================================
  // Cargar saldo real
  // ===================================================
  async function cargarSaldo() {
    try {
      if (!id_espectador) return;
      const res = await axios.get<{ saldo_monedas: number }>(`${BACKEND}/espectadores/${id_espectador}/saldo`);
      setMonedas(res.data.saldo_monedas || 0);
    } catch (error) {
      console.log("Error cargando saldo:", error);
    }
  }


  useEffect(() => {
    cargarSaldo();
  }, []);


  // ===================================================
  // Enviar regalo REAL al backend
  // ===================================================
const handleEnviarRegalo = async (regalo: typeof regalosDisponibles[0]) => {
  try {
    const id_espectador = localStorage.getItem("id_usuario");
    const id_streamer = localStorage.getItem("id_streamer_actual"); // o como lo guardes


    if (!id_espectador || !id_streamer) {
      setMensaje("Error: falta información del usuario o streamer.");
      return;
    }


    // Enviar al backend
    const res = await axios.post<{ saldo_monedas: number }>(`${BACKEND}/regalos/enviar`, {
      id_espectador,
      id_streamer,
      id_regalo: regalo.id_regalo,
      cantidad: 1
    });


    // Actualizar saldo
    setMonedas(res.data.saldo_monedas);


    // Mostrar animación
    setOverlayGift(regalo);
    setOverlayVisible(true);


    setMensaje(`¡Enviaste ${regalo.nombre}!`);
    setTimeout(() => setMensaje(""), 2000);


  } catch (error: any) {
    console.log(error);
    setMensaje(error?.response?.data?.error || "No se pudo enviar el regalo");
    setTimeout(() => setMensaje(""), 2000);
  }
};


  return (
    <div>
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


            {dialogActivo === "principal" && (
              <div className="relative flex justify-start items-start gap-6 min-h-[200px]">
                {regalosDisponibles.map((regalo) => (
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


            {mensaje && (
              <div className="max-w-xl mx-auto mb-2 text-center text-primary font-semibold">
                {mensaje}
              </div>
            )}


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


                <p className="text-sm mb-1">Costo: {RegaloSeleccionado.costo_monedas}</p>
                <p className="text-sm mb-1">Puntos: {RegaloSeleccionado.puntos_otorgados}</p>
                <p className="text-sm mb-4">{RegaloSeleccionado.descripcion}</p>


                <div className="flex justify-center gap-4">
                  <Button
                    variant="secondary"
                    onClick={() => handleEnviarRegalo(RegaloSeleccionado)}
                  >
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


      <GiftOverlay
        gift={overlayGift ? { nombre: overlayGift.nombre, imagen: overlayGift.imagen } : null}
        visible={overlayVisible}
        onClose={() => setOverlayVisible(false)}
      />
    </div>
  );
}
