// src/components/GiftGameModal.tsx
import React, { useEffect, useState } from "react";

export interface GiftForGame {
  id_regalo: string;
  nombre: string;
  costo_monedas: number;
  puntos_otorgados: number;
}

interface Props {
  open: boolean;
  gift: GiftForGame | null;
  onClose: () => void;
  onResult: (multiplier: number) => void;
}

// distribución simple (más probabilidad de x1)
const multipliers = [1, 1, 1, 2, 2, 3];

const GiftGameModal: React.FC<Props> = ({ open, gift, onClose, onResult }) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setSpinning(false);
      setResult(null);
    }
  }, [open]);

  const spin = () => {
    if (spinning || !gift) return;
    setSpinning(true);
    setResult(null);

    setTimeout(() => {
      const idx = Math.floor(Math.random() * multipliers.length);
      const mult = multipliers[idx];
      setResult(mult);
      setSpinning(false);
      onResult(mult); // 👈 se lo devolvemos al padre
    }, 1200);
  };

  if (!open || !gift) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: 360,
          background: "#151515",
          borderRadius: 12,
          padding: 18,
          boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
          border: "1px solid rgba(120,60,160,0.12)",
          color: "#fff",
        }}
      >
        <h3 style={{ margin: 0, marginBottom: 8 }}>
          Mini-juego: multiplicador
        </h3>
        <p style={{ marginTop: 0, marginBottom: 12, color: "#cfc" }}>
          Regalo: <strong>{gift.nombre}</strong> — costo base:{" "}
          {gift.costo_monedas} monedas
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 999,
              background: "linear-gradient(90deg,#ff66cc,#7b2cff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#111",
              fontWeight: 800,
              fontSize: 20,
              transform: spinning ? "rotate(360deg)" : "none",
              transition: "transform 1.2s cubic-bezier(.2,.9,.2,.9)",
            }}
          >
            {spinning ? "..." : result ? `${result}x` : "GIRAR"}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            onClick={spin}
            disabled={spinning}
            style={{
              background: "linear-gradient(90deg,#ff66cc,#7b2cff)",
              border: "none",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {spinning
              ? "Jugando..."
              : result
              ? "Volver a jugar"
              : "Jugar (Girar)"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiftGameModal;
