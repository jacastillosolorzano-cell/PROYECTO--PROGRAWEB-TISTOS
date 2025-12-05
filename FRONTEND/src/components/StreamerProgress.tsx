// src/components/StreamerProgress.tsx
import React, { useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "@/config";
import ProgressBar from "@/components/ProgressBar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type PerfilStreamer = {
  id_usuario: string;
  horas_transmitidas_total: number; // minutos acumulados
  nivel?: {
    orden: number;
    nombre_nivel: string;
  } | null;
};

const StreamerProgress: React.FC = () => {
  const [perfil, setPerfil] = useState<PerfilStreamer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==========================================================
  // HORAS requeridas por nivel (STREAMER)
  // ==========================================================
  const [horasRequeridas, setHorasRequeridas] = useState<number>(() => {
    const saved = localStorage.getItem("streamer_hours_required");
    const n = saved ? Number(saved) : 20;
    return Number.isNaN(n) || n <= 0 ? 20 : n;
  });

  // ==========================================================
  // ⭐ NUEVO: PUNTOS requeridos por nivel (ESPECTADORES)
  // ==========================================================
  const [puntosRequeridosViewer, setPuntosRequeridosViewer] = useState<number>(() => {
    const saved = localStorage.getItem("viewer_points_required");
    const n = saved ? Number(saved) : 100;
    return Number.isNaN(n) || n <= 0 ? 100 : n;
  });

  // ==========================================================
  //  SUBIDA DE NIVEL POPUP
  // ==========================================================
  const [prevNivel, setPrevNivel] = useState<number | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // ==========================================================
  //  CARGAR PERFIL DESDE BACKEND
  // ==========================================================
  useEffect(() => {
    const rawUsuario = localStorage.getItem("usuario");
    if (!rawUsuario) {
      setError("No se encontró usuario en sesión");
      setLoading(false);
      return;
    }

    let usuario: any;
    try {
      usuario = JSON.parse(rawUsuario);
    } catch (e) {
      setError("Error leyendo datos de usuario");
      setLoading(false);
      return;
    }

    const id_streamer: string | undefined =
      usuario.id_usuario ?? usuario.id;

    if (!id_streamer) {
      setError("No se encontró id de streamer");
      setLoading(false);
      return;
    }

    const fetchPerfil = async () => {
      try {
        setLoading(true);
        setError(null);

        const resp = await fetch(
          `${BACKEND_URL}/streamers/perfil/${id_streamer}`
        );

        if (resp.status === 404) {
          setPerfil({
            id_usuario: id_streamer,
            horas_transmitidas_total: 0,
            nivel: null,
          });
          setLoading(false);
          return;
        }

        if (!resp.ok) {
          setError("No se pudo cargar el perfil del streamer");
          setLoading(false);
          return;
        }

        const data = (await resp.json()) as PerfilStreamer;
        setPerfil(data);
      } catch (e) {
        setError("Error de conexión al cargar el perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, []);

  // ==========================================================
  //  CÁLCULOS: horas, nivel, porcentaje
  // ==========================================================
  const totalMinutos = perfil?.horas_transmitidas_total ?? 0;
  const totalHoras = useMemo(() => totalMinutos / 60, [totalMinutos]);

  const nivelActual = useMemo(() => {
    if (perfil?.nivel?.orden) return perfil.nivel.orden;
    if (horasRequeridas <= 0) return 1;
    return Math.floor(totalHoras / horasRequeridas) + 1;
  }, [perfil, totalHoras, horasRequeridas]);

  // DETECTAR SUBIDA DE NIVEL
  useEffect(() => {
    if (nivelActual == null) return;

    if (prevNivel === null) {
      setPrevNivel(nivelActual);
      return;
    }

    if (nivelActual > prevNivel) {
      setShowLevelUp(true);
      toast.success(`🎉 ¡Has subido al nivel ${nivelActual} como streamer!`);
    }

    if (nivelActual !== prevNivel) setPrevNivel(nivelActual);
  }, [nivelActual, prevNivel]);

  // ==========================================================
  //  GUARDAR CONFIGURACIONES
  // ==========================================================
  const handleChangeHorasRequeridas = (value: number) => {
    if (value <= 0) return;
    setHorasRequeridas(value);
    localStorage.setItem("streamer_hours_required", String(value));
  };

  const handleChangePuntosViewer = (value: number) => {
    if (value <= 0) return;
    setPuntosRequeridosViewer(value);
    localStorage.setItem("viewer_points_required", String(value));
  };

  return (
    <div className="max-w-3xl mx-auto bg-card rounded-2xl p-6 mb-8 shadow-lg border border-border/60">
      <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
        <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-primary/10">
          🎥
        </span>
        Mi progreso como Streamer
      </h2>

      {/* ============================================
              CONFIGURACIÓN DE PROGRESIÓN
          ============================================ */}
      <div className="bg-black/30 rounded-xl px-4 py-3 mb-6 border border-white/5">
        <div className="flex flex-col gap-5">

          {/* HORAS REQUERIDAS POR NIVEL */}
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold flex items-center gap-2">
              ⏳ Horas requeridas por nivel (Streamer):
            </span>

            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 bg-muted rounded hover:bg-muted/80 text-lg font-bold"
                onClick={() => handleChangeHorasRequeridas(Math.max(1, horasRequeridas - 1))}
              >
                –
              </button>

              <div className="min-w-[40px] text-center font-semibold">
                {horasRequeridas}
              </div>

              <button
                className="px-2 py-1 bg-muted rounded hover:bg-muted/80 text-lg font-bold"
                onClick={() => handleChangeHorasRequeridas(horasRequeridas + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* ⭐ NUEVO: PUNTOS REQUERIDOS POR NIVEL (VIEWERS) */}
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold flex items-center gap-2">
              🎁 Puntos requeridos por nivel (Espectadores):
            </span>

            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 bg-muted rounded hover:bg-muted/80 text-lg font-bold"
                onClick={() => handleChangePuntosViewer(Math.max(10, puntosRequeridosViewer - 10))}
              >
                –
              </button>

              <div className="min-w-[50px] text-center font-semibold">
                {puntosRequeridosViewer}
              </div>

              <button
                className="px-2 py-1 bg-muted rounded hover:bg-muted/80 text-lg font-bold"
                onClick={() => handleChangePuntosViewer(puntosRequeridosViewer + 10)}
              >
                +
              </button>
            </div>
          </div>

        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Ajusta cuántas horas necesitas para subir de nivel como streamer,  
          y cuántos puntos necesitan tus espectadores para subir dentro de tu canal.
        </p>
      </div>

      {/* ============================================ */}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando progreso...</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <>
          <div className="text-center mb-3 text-sm">
            <span className="text-muted-foreground">Nivel actual:</span>{" "}
            <span className="font-bold text-primary">{nivelActual}</span>
          </div>

          <ProgressBar hoursDone={totalHoras} hoursRequired={horasRequeridas} />

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Sigue haciendo lives para subir de nivel 💪
          </p>

          {showLevelUp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="bg-zinc-900 rounded-2xl px-6 py-5 text-center shadow-xl max-w-sm w-full border border-purple-500/40">
                <h3 className="text-2xl font-bold mb-2 text-purple-400">
                  ¡Nivel {nivelActual} alcanzado! 🎉
                </h3>
                <p className="text-sm text-zinc-200 mb-4">
                  Sigue transmitiendo para desbloquear más beneficios.
                </p>
                <Button onClick={() => setShowLevelUp(false)} className="w-full">
                  Seguir streameando
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StreamerProgress;
