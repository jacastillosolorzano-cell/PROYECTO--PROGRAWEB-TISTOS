// src/components/RouletteModal.tsx
import React, { useEffect, useState } from "react";

interface Sector {
  id: number;
  label: string;   // debe coincidir con resultado_segmento del backend: "+5", "+10", "+20", "+50", "+100", "x2"
  coins: number;
  color?: string;
}

interface RouletteModalProps {
  open: boolean;
  costPoints: number;
  userPoints: number;
  onClose: () => void;
  /**
   * Callback que llama al backend y devuelve el resultado real de la ruleta.
   * Debe lanzar error si algo falla (puntos insuficientes, etc.).
   */
  onPlay: () => Promise<{ resultado_segmento: string; monedas_ganadas: number }>;
}

const SECTORS: Sector[] = [
  { id: 0, label: "+5", coins: 5, color: "#ff9ad6" },
  { id: 1, label: "+10", coins: 10, color: "#ff66cc" },
  { id: 2, label: "+20", coins: 20, color: "#cc66ff" },
  { id: 3, label: "+50", coins: 50, color: "#7b2cff" },
  { id: 4, label: "+100", coins: 100, color: "#66e0ff" },
  { id: 5, label: "x2", coins: 50, color: "#ffd166" }, // visualmente "x2", backend manda resultado_segmento: "x2"
];

const RouletteModal: React.FC<RouletteModalProps> = ({
  open,
  costPoints,
  userPoints,
  onClose,
  onPlay,
}) => {
  const [spinning, setSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [resultSector, setResultSector] = useState<Sector | null>(null);
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sectorCount = SECTORS.length;
  const anglePer = 360 / sectorCount;

  useEffect(() => {
    if (!open) {
      setSpinning(false);
      setResultSector(null);
      setLastReward(null);
      setErrorMsg(null);
      setCurrentRotation(0);
    }
  }, [open]);

  const play = async () => {
    if (spinning) return;
    if (userPoints < costPoints) return;

    setSpinning(true);
    setResultSector(null);
    setErrorMsg(null);
    setLastReward(null);

    try {
      // 1) Llamar al backend vía callback del padre
      const { resultado_segmento, monedas_ganadas } = await onPlay();

      // Guardar recompensa para mostrarla en el panel de la derecha
      setLastReward(monedas_ganadas);

      // 2) Buscar el sector correspondiente al resultado_segmento
      const idx = SECTORS.findIndex(
        (s) => s.label.toLowerCase() === resultado_segmento.toLowerCase()
      );

      const targetIndex = idx >= 0 ? idx : 0; // fallback si no matchea, que no debería pasar

      // 3) Calcular rotación final para que el puntero quede en ese sector
      const spins = 4 + Math.floor(Math.random() * 3); // vueltas completas
      const finalAngle =
        spins * 360 + (360 - targetIndex * anglePer - anglePer / 2);

      // 4) Animar
      setCurrentRotation(finalAngle);

      // 5) Al terminar la transición (~1.9s), fijar sector visualmente
      setTimeout(() => {
        const sector = SECTORS[targetIndex];
        setResultSector(sector);
        setSpinning(false);
      }, 1900);
    } catch (err: any) {
      console.error("Error en ruleta frontend:", err);
      setErrorMsg(err?.message || "Error al jugar la ruleta");
      setSpinning(false);
      setResultSector(null);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }}
      />
      <div
        style={{
          position: "relative",
          width: 420,
          background: "#151515",
          borderRadius: 12,
          padding: 18,
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          border: "1px solid rgba(120,60,160,0.12)",
          color: "#fff",
        }}
      >
        <h3 style={{ margin: 0 }}>Ruleta de puntos</h3>
        <p style={{ marginTop: 6, color: "#cfc", marginBottom: 12 }}>
          Juega con <strong>{costPoints} puntos</strong> para ganar monedas. Tienes{" "}
          {userPoints} pts.
        </p>

        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative", width: 260, height: 260 }}>
            <div
              style={{
                width: 260,
                height: 260,
                borderRadius: "50%",
                overflow: "hidden",
                transform: `rotate(${currentRotation}deg)`,
                transition: spinning
                  ? "transform 1.9s cubic-bezier(.2,.95,.2,.95)"
                  : "none",
                boxShadow: "0 8px 30px rgba(123,44,255,0.12)",
              }}
            >
              {SECTORS.map((s, i) => {
                const rotate = i * anglePer;
                return (
                  <div
                    key={s.id}
                    style={{
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
                      fontSize: 14,
                    }}
                  >
                    <div style={{ transform: `rotate(${anglePer / 2}deg)` }}>
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Indicador */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "-8px",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "12px solid transparent",
                borderRight: "12px solid transparent",
                borderBottom: "16px solid #fff",
              }}
            />
          </div>

          {/* Panel derecho: resultado y acciones */}
          <div style={{ maxWidth: 140 }}>
            <div style={{ marginBottom: 8, color: "#ddd" }}>Resultado</div>
            <div
              style={{
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#111",
                borderRadius: 8,
                padding: "8px 10px",
                textAlign: "center",
                fontSize: 13,
              }}
            >
              {spinning
                ? "Girando..."
                : errorMsg
                ? errorMsg
                : resultSector
                ? `${resultSector.label} → +${
                    lastReward ?? resultSector.coins
                  } monedas`
                : "Listo"}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.06)",
                  padding: 8,
                  borderRadius: 8,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
              <button
                onClick={play}
                disabled={spinning || userPoints < costPoints}
                style={{
                  flex: 1,
                  background:
                    userPoints >= costPoints
                      ? "linear-gradient(90deg,#ff66cc,#7b2cff)"
                      : "#333",
                  border: "none",
                  color: "#fff",
                  padding: 8,
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor:
                    userPoints >= costPoints ? "pointer" : "not-allowed",
                }}
              >
                Jugar
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 13, color: "#9a9a9a" }}>
          Tip: ganas puntos cada vez que envías mensajes. Ahorra {costPoints} pts para
          jugar.
        </div>
      </div>
    </div>
  );
};

export default RouletteModal;
