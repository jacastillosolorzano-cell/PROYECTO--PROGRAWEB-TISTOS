import React, { useEffect, useRef, useState } from "react";
import ConfigPanel from "./ConfigPanel";
import ProgressBar from "./ProgressBar";
import TotalHours from "./TotalHours";
import LevelUpAlert from "./LevelUpAlert";

const KEY_DONE = "streamer_hours_done_v1";
const KEY_REQUIRED = "streamer_hours_required_v1";

/**
 * AUTO_INCREMENT_MS: intervalo para sumar 1 hora automáticamente.
 * Ajusta el valor según necesites; en producción deberías usar la fuente real (API / socket).
 */
const AUTO_INCREMENT_MS = 5000; // 5s -> +1 hora cada 5s (simulación)

const StreamerProgress: React.FC = () => {
  const [hoursRequired, setHoursRequired] = useState<number>(20);
  const [hoursDone, setHoursDone] = useState<number>(15);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevelRef = useRef<number>(0);

  // leer almacenamiento al inicio
  useEffect(() => {
    const sDone = localStorage.getItem(KEY_DONE);
    const sReq = localStorage.getItem(KEY_REQUIRED);
    if (sDone) setHoursDone(Number(sDone));
    if (sReq) setHoursRequired(Number(sReq));
  }, []);

  // persistir cambios
  useEffect(() => {
    localStorage.setItem(KEY_DONE, String(hoursDone));
  }, [hoursDone]);

  useEffect(() => {
    localStorage.setItem(KEY_REQUIRED, String(hoursRequired));
  }, [hoursRequired]);

  // auto incremento (simulación): sumar 1 hora cada intervalo si la pestaña está visible
  useEffect(() => {
    const tick = () => {
      if (document.hidden) return;
      setHoursDone((h) => h + 1);
    };
    const id = window.setInterval(tick, AUTO_INCREMENT_MS);
    return () => window.clearInterval(id);
  }, []);

  const level = Math.max(1, Math.floor(hoursDone / Math.max(1, hoursRequired)) + 1);

  // detectar level up (mostrar modal una sola vez por subida de nivel)
  useEffect(() => {
    const prev =
      prevLevelRef.current ||
      Math.max(1, Math.floor(Math.max(0, hoursDone - 1) / Math.max(1, hoursRequired)) + 1);
    if (level > prev) {
      setShowLevelUp(true);
    }
    prevLevelRef.current = level;
  }, [level, hoursDone, hoursRequired]);

  return (
    <section style={{ maxWidth: 920, margin: "0 auto", padding: "20px" }}>
      <div
        style={{
          borderRadius: 18,
          padding: 28,
          background: "#151515",
          boxShadow: "0 0 60px rgba(124,58,237,0.12), inset 0 0 40px rgba(124,58,237,0.04)",
          border: "1px solid rgba(120,60,160,0.12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#222",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            
            🎥
            
          </div>
          <h3 style={{ color: "#fff", margin: 0, fontSize: 20 }}> Mi progreso como Streamer</h3>
        </div>

        <div style={{ marginBottom: 12 }}>
          <ConfigPanel hoursPerLevel={hoursRequired} setHoursPerLevel={setHoursRequired} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <TotalHours hoursDone={hoursDone} level={level} />
        </div>

        <div style={{ marginBottom: 6 }}>
          
          {/* mostramos progreso dentro del nivel: hoursDone % hoursRequired */}
          <ProgressBar hoursDone={hoursDone % hoursRequired} hoursRequired={hoursRequired} />
        </div>

        <p style={{ textAlign: "center", marginTop: 12, color: "#bdbdbd", fontSize: 13 }}>
          Mantén tus transmisiones activas para alcanzar el siguiente nivel 💪
        </p>
      </div>

      <LevelUpAlert open={showLevelUp} level={level} onClose={() => setShowLevelUp(false)} />
    </section>
  );
};

export default StreamerProgress;