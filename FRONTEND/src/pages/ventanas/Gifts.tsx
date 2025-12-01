import { Button } from "@/components/ui/button";
import { Gift, Settings, User, Coins } from "lucide-react";
import { useState } from "react";
import { Dialog,DialogContent,DialogHeader,DialogFooter } from "@/components/ui/dialog";
import Profile from "../Profile";
import { useNavigate } from "react-router-dom";
import tomba from "@/components/imagenes/tomba.png"
import dina from "@/components/imagenes/Dina.png"
import GiftOverlay from "./GiftOverlay";

const regalosDisponibles = [
  {
      id: 1,
      nombre: "Tomba",
      costo: 2,
      puntos: 20,
      imagen: tomba,
      descripcion:" Para que nunca te falte el pasaje",
      ancho:100,
      alto:100,
    },
  {
      id: 2,
      nombre: "Dina",
      costo: 10,
      puntos: 100,
      imagen: dina,
      descripcion:" Para tu sopa, segundo y postresito",
      ancho:150,
      alto:75,

    },
];

export default function MenuRegalos()
{
  const [dialogActivo, setDialogActivo] = useState("principal");
  const navigate = useNavigate();
  const [monedas, setMonedas] = useState(50); // saldo inicial
  const [puntos, setPuntos] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [RegaloSeleccionado , setRegaloSeleccionado]=useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayGift, setOverlayGift] = useState(null as null | typeof regalosDisponibles[0]);
  const handleComprarMonedas = () => {
    setMonedas(monedas + 100);
    setMensaje("¡Has comprado 100 monedas!");
    setTimeout(() => setMensaje(""), 1500);
  };
  const[openGifts, setGifts] = useState(false);
    
  const handleEnviarRegalo = (regalo: typeof regalosDisponibles[0]) => {
    if (monedas >= regalo.costo) {
      setMonedas(monedas - regalo.costo);
      setPuntos(puntos + regalo.puntos);
      setMensaje(`¡Has enviado una ${regalo.nombre} y apoyado al streamer!`);
      setOverlayGift(regalo);
      setOverlayVisible(true);
      setTimeout(() => setMensaje(""), 2000);
    } else {
      setMensaje("No tienes suficientes monedas.");
      setTimeout(() => setMensaje(""), 2000);
    }
  };    

    return(

        <div>
            <button className="flex items-center gap-2
            bg-pink-500 hover:bg-pink-600 text-white font-semibold px-4 py-2 rounded-xl shadow-md transition"
            onClick={()=>
            {
                setGifts(true)
            }                
            }>
                🎁
                            
            </button>

            <Dialog open={openGifts} onOpenChange={setGifts} >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <div className="border-b-2 border-white pb-2 mb-4 flex items-center justify-between">
                        
                        <h1 className="text-pink-600 text-3xl font-bold " >Regalos</h1>
                        
                        <div className="text-right">
                          <h1 className="text-muted-foreground"> Saldo</h1>
                          <h1 className="text-2xl font-bold">{monedas} SOLES</h1>
                        </div>                        
                      </div>

                      {dialogActivo==="principal"&&(
                        <div className="relative flex justify-start items-start gap-6 min-h-[200px]">
                          {/* Botones de regalos */}
                          {regalosDisponibles.map((regalo) => (
                            <button
                              key={regalo.id}
                              onClick={() => {
                                setRegaloSeleccionado(regalo);
                                setDialogActivo("dialogo2");
                              }}
                              className="hover:scale-105 transition"
                            >
                              <img
                                src={regalo.imagen}
                                alt={regalo.nombre}
                                className="w-10 h-10 object-contain"
                              />
                            </button>
                          ))}
                          <div className="absolute bottom-2 right-2 flex flex-col items-end">
                            <div className="flex items-center gap-3 bg-card/50 p-2 rounded-lg backdrop-blur-md">
                                <span className="font-bold text-lg flex items-center gap-2">
                                  <Coins className="w-6 h-6 text-yellow-400" /> Monedas
                                </span>
                                <Button variant="link" size="sm" onClick={handleComprarMonedas}>
                                  Obtener Monedas
                                </Button>                                
                            </div>
                          </div>
                          
                          
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
                            alt={RegaloSeleccionado.nombre}
                            style={{
                              width: RegaloSeleccionado.ancho,
                              height: RegaloSeleccionado.alto,
                              objectFit: "contain",
                              margin: "0 auto",
                            }}
                            className="mb-4"  
                          />
                          <p className="text-sm mb-1"> Costo: s/ {RegaloSeleccionado.costo} </p>
                          <p className="text-sm mb-4">Puntos: {RegaloSeleccionado.puntos}</p>
                          <p className="text-sm mb-4"> Descripcion:{RegaloSeleccionado.descripcion}</p>

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
       



    )
}