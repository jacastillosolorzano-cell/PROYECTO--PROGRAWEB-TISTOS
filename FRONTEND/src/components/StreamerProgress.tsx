// src/components/StreamerProgress.tsx
import React, { useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "@/config";
import ProgressBar from "@/components/ProgressBar";
import { toast } from "sonner";

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

  // Horas requeridas por nivel (configurable en el UI)
  const [horasRequeridas, setHorasRequeridas] = useState<number>(() => {
    const saved = localStorage.getItem("streamer_hours_required");
    const n = saved ? Number(saved) : 20;
    return Number.isNaN(n) || n <= 0 ? 20 : n;
  });

  // ==========================================================
  //   CARGAR PERFIL DEL STREAMER DESDE BACKEND
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
      console.error("Error parseando usuario:", e);
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
          // Si aún no tiene perfil, asumimos 0 minutos
          setPerfil({
            id_usuario: id_streamer,
            horas_transmitidas_total: 0,
            nivel: null,
          });
          setLoading(false);
          return;
        }

        if (!resp.ok) {
          console.warn("Error al obtener perfil:", resp.status);
          setError("No se pudo cargar el perfil del streamer");
          setLoading(false);
          return;
        }

        const data = (await resp.json()) as PerfilStreamer;
        setPerfil(data);
      } catch (e) {
        console.error("Error fetch perfil streamer:", e);
        setError("Error de conexión al cargar el perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, []);

  // ==========================================================
  //   DERIVADOS: HORAS, NIVEL, PORCENTAJE
  // ==========================================================
  const totalMinutos = perfil?.horas_transmitidas_total ?? 0;
  const totalHoras = useMemo(() => totalMinutos / 60, [totalMinutos]);

  const nivelActual = useMemo(() => {
    if (perfil?.nivel?.orden) return perfil.nivel.orden;
    // Si no viene nivel del backend, calculamos algo simple
    if (horasRequeridas <= 0) return 1;
    return Math.floor(totalHoras / horasRequeridas) + 1;
  }, [perfil, totalHoras, horasRequeridas]);

  // Formateo para mostrar horas "2h 11m"
  const horasEnteras = Math.floor(totalHoras);
  const minutosRestantes = Math.round((totalHoras - horasEnteras) * 60);

  // Guardar en localStorage cuando se cambie la progresión
  const handleChangeHorasRequeridas = (value: number) => {
    if (Number.isNaN(value) || value <= 0) return;
    setHorasRequeridas(value);
    localStorage.setItem("streamer_hours_required", String(value));
  };
useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const fetchLevelNotifications = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/notificaciones?tipo=NIVEL_STREAMER_SUBIDO&soloNoLeidas=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) return;
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) return;

        const notif = data[0]; // la más reciente
        const mensaje: string =
          notif.mensaje || "¡Has subido de nivel como streamer! 🎉";

        // Mostrar toast al entrar al Studio
        toast.success(mensaje);

        // Marcar como leída para no repetir aviso
        if (notif.id_notificacion) {
          await fetch(
            `${BACKEND_URL}/notificaciones/${notif.id_notificacion}/leida`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }
      } catch (err) {
        console.error("Error consultando notificaciones de nivel:", err);
      }
    };

    fetchLevelNotifications();
  }, []);
  
  return (
    <div className="max-w-3xl mx-auto bg-card rounded-2xl p-6 mb-8 shadow-lg border border-border/60">
      <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
        <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-primary/10">
          🎥
        </span>
        Mi progreso como Streamer
      </h2>

      {/* Configurar progresión */}
      <div className="bg-black/30 rounded-xl px-4 py-3 mb-6 border border-white/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-muted">
              ⚙️
            </span>
            <span>Configurar progresión</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Horas requeridas por nivel:</span>
             {/* ⭐ Control con botones + y - */}
  <div className="flex items-center gap-2">
    <button
      className="px-2 py-1 bg-muted rounded hover:bg-muted/80 text-lg font-bold"
      onClick={() => {
        const next = Math.max(1, horasRequeridas - 1);
        handleChangeHorasRequeridas(next);
      }}
    >
      –
    </button>

    <div className="min-w-[40px] text-center font-semibold">
      {horasRequeridas}
    </div>

    <button
      className="px-2 py-1 bg-muted rounded hover:bg-muted/80 text-lg font-bold"
      onClick={() => {
        const next = horasRequeridas + 1;
        handleChangeHorasRequeridas(next);
      }}
    >
      +
    </button>
  </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Cambia este valor para ajustar qué tan rápido subes de nivel como
          streamer.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          Cargando progreso de streamer...
        </p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <>
          {/* Nivel actual */}
          <div className="text-center mb-3 text-sm">
            <span className="text-muted-foreground mr-1">Nivel actual:</span>
            <span className="font-bold text-primary">
              {nivelActual ?? 1}
            </span>
          </div>

          {/* Barra de progreso usando tu componente */}
          <ProgressBar
            hoursDone={totalHoras}
            hoursRequired={horasRequeridas}
          />

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Sigue haciendo lives para subir de nivel 💪
          </p>

          
        </>
      )}
    </div>
  );
};



export default StreamerProgress;
