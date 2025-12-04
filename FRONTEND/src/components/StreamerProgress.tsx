// src/components/StreamerProgress.tsx
import React, { useEffect, useRef, useState } from "react";
import ConfigPanel from "./ConfigPanel";
import ProgressBar from "./ProgressBar";
import TotalHours from "./TotalHours";
import LevelUpAlert from "./LevelUpAlert";
import { BACKEND_URL } from "@/config";

const AUTO_REFRESH_MS = 30000; // refrescar cada 30s desde el backend

const StreamerProgress: React.FC = () => {
  const [hoursRequired, setHoursRequired] = useState<number>(20); // horas para subir de nivel (configurable)
  const [hoursDone, setHoursDone] = useState<number>(0);          // horas transmitidas (vienen del backend)
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevelRef = useRef<number>(0);

  // ================================
  //   CARGAR PERFIL STREAMER (BACKEND)
  // ================================
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.warn("No hay authToken, no se puede leer /streamers/perfil");
          return;
        }

        const resp = await fetch(`${BACKEND_URL}/streamers/perfil`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!resp.ok) {
          console.warn(
            "No se pudo obtener perfil streamer:",
            resp.status,
            await resp.text()
          );
          return;
        }

        const data: any = await resp.json();
        // depende de cómo devolviste en el backend, cubrimos 2 casos:
        // 1) { perfil: {...} }
        // 2) {...directamente...}
        const perfil = data.perfil ?? data;

        // En la BD guardamos minutos transmitidos, los convertimos a horas:
        const minutosTotales: number = perfil.horas_transmitidas_total ?? 0;
        const horas = minutosTotales / 60;
        setHoursDone(horas);

        // Si tu backend ya manda info del nivel, puedes usarla para hoursRequired
        // Por ejemplo: perfil.nivel?.horas_por_nivel
        if (
          perfil.nivel &&
          typeof perfil.nivel.horas_por_nivel === "number"
        ) {
          setHoursRequired(perfil.nivel.horas_por_nivel);
        }
      } catch (error) {
        console.error("Error al cargar perfil streamer:", error);
      }
    };

    // Primera carga
    fetchPerfil();
    // Refresco periódico mientras estés en la pantalla
    const id = window.setInterval(fetchPerfil, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  // ================================
  //   CÁLCULO DE NIVEL
  // ================================
  const level = Math.max(
    1,
    Math.floor(hoursDone / Math.max(1, hoursRequired)) + 1
  );

  // Detectar cuando sube de nivel para mostrar el modal
  useEffect(() => {
    const prev =
      prevLevelRef.current ||
      Math.max(
        1,
        Math.floor(
          Math.max(0, hoursDone - 0.01) / Math.max(1, hoursRequired)
        ) + 1
      );

    if (level > prev) {
      setShowLevelUp(true);
    }

    prevLevelRef.current = level;
  }, [level, hoursDone, hoursRequired]);

  // ================================
  //   RENDER
  // ================================
  // Progreso dentro del nivel actual: resto de horas
  const hoursWithinLevel =
    hoursRequired > 0 ? hoursDone % hoursRequired : 0;

  return (
    <section style={{ maxWidth: 920, margin: "0 auto", padding: "20px" }}>
      <div
        style={{
          borderRadius: 18,
          padding: 28,
          background: "#151515",
          boxShadow:
            "0 0 60px rgba(124,58,237,0.12), inset 0 0 40px rgba(124,58,237,0.04)",
          border: "1px solid rgba(120,60,160,0.12)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
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
          <h3 style={{ color: "#fff", margin: 0, fontSize: 20 }}>
            Mi progreso como Streamer
          </h3>
        </div>

        {/* Configuración de horas por nivel (sigue siendo editable en frontend) */}
        <div style={{ marginBottom: 12 }}>
          <ConfigPanel
            hoursPerLevel={hoursRequired}
            setHoursPerLevel={setHoursRequired}
          />
        </div>

        {/* Horas totales y nivel actual */}
        <div style={{ marginBottom: 12 }}>
          <TotalHours hoursDone={hoursDone} level={level} />
        </div>

        {/* Barra de progreso dentro del nivel */}
        <div style={{ marginBottom: 6 }}>
          <ProgressBar
            hoursDone={hoursWithinLevel}
            hoursRequired={hoursRequired}
          />
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 12,
            color: "#bdbdbd",
            fontSize: 13,
          }}
        >
          Las horas transmitidas se leen desde el backend
          (sesiones finalizadas). Sigue haciendo lives para subir de nivel 💪
        </p>
      </div>

      <LevelUpAlert
        open={showLevelUp}
        level={level}
        onClose={() => setShowLevelUp(false)}
      />
    </section>
  );
};

export default StreamerProgress;
