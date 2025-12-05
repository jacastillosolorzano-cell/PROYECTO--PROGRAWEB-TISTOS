// src/pages/ventanas/GiftOverlay.tsx
import React, { useEffect } from "react";

interface GiftInfo {
  nombre: string;
  regalo: string;
  imagen?: string;
  multiplicador?: number;
}

interface GiftOverlayProps {
  gift: GiftInfo | null;   // 👈 IMPORTANTE: acepta null
  visible: boolean;
  onClose: () => void;
}

const GiftOverlay: React.FC<GiftOverlayProps> = ({
  gift,
  visible,
  onClose,
}) => {
  // Auto-cerrar después de 4 segundos
  useEffect(() => {
    if (!visible || !gift) return;
    const t = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(t);
  }, [visible, gift, onClose]);

  // Si no hay regalo o no debe mostrarse, no renderiza nada
  if (!visible || !gift) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-start justify-start p-4">
      <div className="pointer-events-auto animate-gift-enter bg-black/80 border border-pink-500/50 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
        {/* Icono / imagen del regalo */}
        <div className="w-12 h-12 rounded-full bg-pink-500/80 flex items-center justify-center overflow-hidden animate-gift-pulse">
          {gift.imagen ? (
            <img
              src={gift.imagen}
              alt={gift.regalo}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl">🎁</span>
          )}
        </div>

        {/* Texto */}
        <div className="flex flex-col leading-tight text-white">
          <span className="text-sm font-semibold text-pink-300">
            {gift.nombre}
          </span>
          <span className="text-xs">
            envió{" "}
            <span className="font-bold text-pink-400">{gift.regalo}</span>
          </span>
          {gift.multiplicador && gift.multiplicador > 1 && (
            <span className="text-[11px] text-pink-200 mt-1">
              Combo x{gift.multiplicador} 🔥
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftOverlay;
