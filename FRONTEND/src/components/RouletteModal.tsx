import React, { useEffect, useRef, useState } from "react";

interface Sector {
  id: number;
  label: string;
  coins: number;
  color?: string;
}

interface Props {
  open: boolean;
  costPoints: number;
  onClose: () => void;
  onResult: (rewardCoins: number, sector: Sector) => void;
  userPoints: number;
}

const SECTORS: Sector[] = [
  { id: 0, label: "+5", coins: 5, color: "#ff9ad6" },
  { id: 1, label: "+10", coins: 10, color: "#ff66cc" },
  { id: 2, label: "+20", coins: 20, color: "#cc66ff" },
  { id: 3, label: "+50", coins: 50, color: "#7b2cff" },
  { id: 4, label: "+100", coins: 100, color: "#66e0ff" },
  { id: 5, label: "x2", coins: 0, color: "#ffd166" }, // special: doubles a base (handled in logic if needed)
];

const RouletteModal: React.FC<Props> = ({ open, costPoints, onClose, onResult, userPoints }) => {
  const [spinning, setSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [resultSector, setResultSector] = useState<Sector | null>(null);
  const wheelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setSpinning(false);
      setResultSector(null);
      setCurrentRotation(0);
    }
  }, [open]);

  const sectorCount = SECTORS.length;
  const anglePer = 360 / sectorCount;

  const play = () => {
    if (spinning) return;
    if (userPoints < costPoints) return;
    setSpinning(true);
    setResultSector(null);

    // Elegir sector final aleatorio (puedes ajustar probabilidades)
    const randIndex = Math.floor(Math.random() * sectorCount);
    const spins = 4 + Math.floor(Math.random() * 3); // vueltas completas
    const finalAngle = spins * 360 + (360 - (randIndex * anglePer) - anglePer / 2);

    // animar
    setTimeout(() => {
      setCurrentRotation(finalAngle);
      // al finalizar la transición (1.8s) resolver resultado
      setTimeout(() => {
        const sector = SECTORS[randIndex];
        setResultSector(sector);
        setSpinning(false);
        // devolver recompensa real: si sector.id===5 (x2) devolvemos 2x de un valor base (ej. 25)
        if (sector.id === 5) {
          const reward = 50; // valor fijo para x2 especial (puedes cambiar)
          onResult(reward, sector);
        } else {
          onResult(sector.coins, sector);
        }
      }, 1900);
    }, 80);
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
      <div style={{
        position: "relative",
        width: 420,
        background: "#151515",
        borderRadius: 12,
        padding: 18,
        boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        border: "1px solid rgba(120,60,160,0.12)",
        color: "#fff"
      }}>
        <h3 style={{ margin: 0 }}>Ruleta de puntos</h3>
        <p style={{ marginTop: 6, color: "#cfc", marginBottom: 12 }}>
          Juega con <strong>{costPoints} puntos</strong> para ganar monedas. Tienes {userPoints} pts.
        </p>

        <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: 260, height: 260 }}>
            <div
              ref={wheelRef}
              style={{
                width: 260,
                height: 260,
                borderRadius: "50%",
                overflow: "hidden",
                transform: `rotate(${currentRotation}deg)`,
                transition: spinning ? "transform 1.9s cubic-bezier(.2,.95,.2,.95)" : "none",
                boxShadow: "0 8px 30px rgba(123,44,255,0.12)"
              }}
            >
              {/* Dibujar sectores como capas con transform rotate */}
              {SECTORS.map((s, i) => {
                const rotate = i * anglePer;
                return (
                  <div key={s.id} style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 260,
                    height: 260,
                    transformOrigin: "0% 0%",
                    transform: `rotate(${rotate}deg) translate(-50%, -50%)`,
                    clipPath: `polygon(50% 50%, 0% 100%, 100% 100%)`,
                    background: s.color ?? "#333",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    paddingBottom: 28,
                    color: "#111",
                    fontWeight: 700,
                    fontSize: 14
                  }}>
                    <div style={{ transform: `rotate(${anglePer / 2}deg)` }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Indicador */}
            <div style={{
              position: "absolute",
              left: "50%",
              top: "-8px",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderBottom: "16px solid #fff",
            }} />
          </div>

          <div style={{ maxWidth: 120 }}>
            <div style={{ marginBottom: 8, color: "#ddd" }}>Resultado</div>
            <div style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "#111", borderRadius: 8, padding: "8px 10px" }}>
              {spinning ? "Girando..." : (resultSector ? `${resultSector.label} → ${resultSector.coins || "Especial"}` : "Listo")}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button onClick={onClose} style={{
                flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.06)", padding: 8, borderRadius: 8, color: "#fff"
              }}>Cerrar</button>
              <button
                onClick={play}
                disabled={spinning || userPoints < costPoints}
                style={{
                  flex: 1,
                  background: userPoints >= costPoints ? "linear-gradient(90deg,#ff66cc,#7b2cff)" : "#333",
                  border: "none",
                  color: "#fff",
                  padding: 8,
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: userPoints >= costPoints ? "pointer" : "not-allowed"
                }}
              >
                Jugar
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 13, color: "#9a9a9a" }}>
          Tip: ganas puntos cada vez que envías mensajes. Ahorra {costPoints} pts para jugar.
        </div>
      </div>
    </div>
  );
};

export default RouletteModal;