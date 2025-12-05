import React, { useEffect, useState } from "react";
import { BACKEND_URL } from "@/config";
import { X } from "lucide-react";

interface Gift {
  id_regalo: string;
  nombre: string;
  costo_monedas: number;
  puntos_otorgados: number;
  imagen_url?: string; // URL de la imagen guardada al crear el regalo
}

interface GiftModalProps {
  open: boolean;
  onClose: () => void;
  streamId: string;           // 👈 id de la sesión / stream actual
  saldoMonedas: number;       // saldo del espectador
  onSendGift: (gift: Gift) => void; // callback para enviar regalo
}

const GiftModal: React.FC<GiftModalProps> = ({
  open,
  onClose,
  streamId,
  saldoMonedas,
  onSendGift,
}) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchGifts = async () => {
      try {
        setLoading(true);
        // 👇 solo traemos los regalos de ESTA SESIÓN
        const res = await fetch(
          `${BACKEND_URL}/regalos?streamId=${encodeURIComponent(streamId)}`
        );

        if (!res.ok) {
          console.error("No se pudieron cargar los regalos");
          setGifts([]);
          return;
        }

        const data = (await res.json()) as Gift[];
        setGifts(data);
      } catch (err) {
        console.error("Error al cargar regalos:", err);
        setGifts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGifts();
  }, [open, streamId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-zinc-950 rounded-2xl shadow-xl w-full max-w-md mx-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-pink-400">Regalos</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-xs text-muted-foreground">Saldo</span>
            <span className="font-semibold">{saldoMonedas} monedas</span>
            <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <p className="text-xs text-muted-foreground">Cargando regalos…</p>
        ) : gifts.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No hay regalos creados para este live.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {gifts.map((gift) => (
              <button
                key={gift.id_regalo}
                onClick={() => onSendGift(gift)}
                className="bg-zinc-900 rounded-xl p-2 text-left hover:bg-zinc-800 transition border border-zinc-800"
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center">
                    {gift.imagen_url ? (
                      <img
                        src={gift.imagen_url}
                        alt={gift.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">🎁</span>
                    )}
                  </div>

                  <div className="text-xs mt-1 text-center">
                    <div className="font-semibold">{gift.nombre}</div>
                    <div className="flex justify-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        🪙 <span>{gift.costo_monedas}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        ⭐ <span>{gift.puntos_otorgados}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftModal;
