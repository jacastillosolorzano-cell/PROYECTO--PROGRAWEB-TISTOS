// ===============================================================
//                         STUDIO.TSX FINAL
// ===============================================================

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  UserCheck,
  GraduationCap,
  Flame,
  Gift,
  Edit,
  Trash2,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import StreamerProgress from "@/components/StreamerProgress";
import OverlayAnimator from "@/components/OverlayAnimator";
import { BACKEND_URL } from "@/config";
import LevelUpAlert from "@/components/LevelUpAlert";

const posts = [
  {
    id: 1,
    usuario: "streamer1",
    texto: "¡Bienvenidos al directo! #stream #tistos",
    vistas: "3.5M",
    likes: "258.7K",
    categoria: "Trending",
    img: "https://picsum.photos/seed/stream1/80/80",
  },
  {
    id: 2,
    usuario: "streamer2",
    texto: "Hoy hablamos de tecnología 🚀 #tech",
    vistas: "6.4M",
    likes: "446.6K",
    categoria: "Recommended",
    img: "https://picsum.photos/seed/stream2/80/80",
  },
];

// ------------------------------------------
// Helper para TOKEN
// ------------------------------------------
const getAuthHeaders = (extra: Record<string, string> = {}) => {
  const token = localStorage.getItem("authToken");
  const headers: Record<string, string> = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const Studio = () => {
  const navigate = useNavigate();

  const [tab, setTab] = useState("monetizacion");
  const [regalos, setRegalos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);

  // ⭐ Popup de subir nivel streamer
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [levelUpMessage, setLevelUpMessage] = useState("");

  const [nuevoRegalo, setNuevoRegalo] = useState({
    nombre: "",
    costo: "",
    puntos: "",
  });

  const [editId, setEditId] = useState<string | null>(null);

  // ===========================================================
  //  USUARIO ACTUAL
  // ===========================================================
  const rawUsuario = localStorage.getItem("usuario");
  let usuarioActual: any = null;

  try {
    usuarioActual = rawUsuario ? JSON.parse(rawUsuario) : null;
  } catch {
    usuarioActual = null;
  }

  const id_streamer: string | undefined =
    usuarioActual?.id_usuario ?? usuarioActual?.id;

  // ===========================================================
  //  ⭐ Horas de transmisión totales
  // ===========================================================
  const [horas, setHoras] = useState(0);
  const [minutos, setMinutos] = useState(0);

  useEffect(() => {
    if (!id_streamer) return;

    const fetchPerfil = async () => {
      try {
        const resp = await fetch(
          `${BACKEND_URL}/streamers/perfil/${id_streamer}`,
          { headers: getAuthHeaders() }
        );

        if (!resp.ok) {
          console.warn("No se encontró perfil streamer");
          return;
        }

        const data = await resp.json();
        const totalMin = data.horas_transmitidas_total ?? 0;

        setHoras(Math.floor(totalMin / 60));
        setMinutos(totalMin % 60);
      } catch (err) {
        console.error("Error obteniendo horas transmitidas:", err);
      }
    };

    fetchPerfil();
  }, [id_streamer]);

  // ===========================================================
  //   SOCKET: escuchar regalos
  // ===========================================================
  useEffect(() => {
    if (!id_streamer) return;

    const socket = io(BACKEND_URL, { autoConnect: true });

    socket.on("connect", () => {
      console.log("Socket conectado (frontend Studio):", socket.id);
      socket.emit("join_streamer_room", id_streamer);
    });

    socket.on("gift_received", (data: any) => {
      const detail = {
        type: "gift",
        from: data.espectador_nombre || data.id_espectador,
        giftName: data.regalo?.nombre || data.id_regalo || "Regalo",
        points: data.puntos_otorgados || data.puntos || 0,
        multiplier: data.cantidad || 1,
      };
      window.dispatchEvent(new CustomEvent("tistos:overlay", { detail }));
    });

    socket.on("disconnect", () => {
      console.log("Socket desconectado (frontend Studio)");
    });

    // cleanup
    return () => {
      socket.disconnect();
    };
  }, [id_streamer]);

  // ===========================================================
  //  ⭐ POPUP: notificación de subida de nivel streamer
  // ===========================================================
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

        const notif = data[0];

        const mensaje: string =
          notif.mensaje || "¡Has subido de nivel como streamer! 🎉";

        // abrir popup
        setLevelUpMessage(mensaje);
        setLevelUpOpen(true);

        // marcar como leída
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

  // ===========================================================
  // CAMBIAR A STREAMER (si no lo es)
  // ===========================================================
  const cambiarARolStreamer = async (id: string) => {
    try {
      const resp = await fetch(`${BACKEND_URL}/usuarios/${id}/rol`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ rol: "STREAMER" }),
      });

      if (resp.ok) {
        const usuarioActualizado = await resp.json();
        localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
        localStorage.setItem(
          "tistos_current_user",
          JSON.stringify(usuarioActualizado)
        );
        toast.success("Modo streamer activado");
      } else {
        toast.error("No se pudo activar modo streamer");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al activar modo streamer");
    }
  };

  // ===========================================================
  // CARGAR REGALOS DEL STREAMER
  // ===========================================================
  const cargarRegalos = async (id: string) => {
    try {
      setLoading(true);

      const resp = await fetch(
        `${BACKEND_URL}/regalos/streamer/${id}`,
        { headers: getAuthHeaders() }
      );

      if (resp.ok) {
        setRegalos(await resp.json());
      }
    } catch (err) {
      toast.error("Error cargando regalos");
    } finally {
      setLoading(false);
    }
  };

  // ===========================================================
  // INICIALIZAR STUDIO (rol + regalos)
  // ===========================================================
  useEffect(() => {
    const init = async () => {
      if (!id_streamer) return;

      const check = await fetch(`${BACKEND_URL}/usuarios/${id_streamer}`, {
        headers: getAuthHeaders(),
      });

      if (check.ok) {
        const data = await check.json();
        if (data.rol !== "STREAMER") await cambiarARolStreamer(id_streamer);
      } else {
        await cambiarARolStreamer(id_streamer);
      }

      await cargarRegalos(id_streamer);
    };

    init();
  }, [id_streamer]);

  // ===========================================================
  // GUARDAR / EDITAR REGALO
  // ===========================================================
  const handleSaveRegalo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nuevoRegalo.nombre || !nuevoRegalo.costo || !nuevoRegalo.puntos) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    try {
      if (editId) {
        const resp = await fetch(`${BACKEND_URL}/regalos/${editId}`, {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            nombre: nuevoRegalo.nombre,
            costo_monedas: Number(nuevoRegalo.costo),
            puntos_otorgados: Number(nuevoRegalo.puntos),
          }),
        });

        if (resp.ok) {
          toast.success("Regalo actualizado");
        } else {
          toast.error("Error al actualizar regalo");
        }
      } else {
        const resp = await fetch(`${BACKEND_URL}/regalos/crear`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            id_streamer,
            nombre: nuevoRegalo.nombre,
            costo_monedas: Number(nuevoRegalo.costo),
            puntos_otorgados: Number(nuevoRegalo.puntos),
          }),
        });

        if (resp.ok) {
          toast.success("Regalo creado");
        } else {
          toast.error("Error al crear regalo");
        }
      }

      setNuevoRegalo({ nombre: "", costo: "", puntos: "" });
      if (id_streamer) await cargarRegalos(id_streamer);
    } catch (err) {
      toast.error("Error al guardar regalo");
    }
  };

  // ===========================================================
  // ELIMINAR REGALO
  // ===========================================================
  const handleDelete = async (id_regalo: string) => {
    try {
      const resp = await fetch(`${BACKEND_URL}/regalos/${id_regalo}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (resp.ok) {
        toast.success("Regalo eliminado");
        if (id_streamer) cargarRegalos(id_streamer);
      } else {
        toast.error("Error al eliminar regalo");
      }
    } catch {
      toast.error("Error al eliminar");
    }
  };

  // ===========================================================
  // EDITAR REGALO
  // ===========================================================
  const handleEdit = (r: any) => {
    setEditId(r.id_regalo);
    setNuevoRegalo({
      nombre: r.nombre,
      costo: String(r.costo_monedas),
      puntos: String(r.puntos_otorgados),
    });
  };

  // ===========================================================
  // RENDER
  // ===========================================================
  return (
    <div className="min-h-screen bg-background relative pb-20">
      {/* Popup de subida de nivel streamer */}
      <LevelUpAlert
        open={levelUpOpen}
        message={levelUpMessage}
        onClose={() => setLevelUpOpen(false)}
      />

      {/* Back */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      <h2 className="text-3xl font-bold text-center pt-8 mb-6">
        Tistos Studio
      </h2>

      <OverlayAnimator />
      <StreamerProgress />

      {/* ⭐ CARD DE ESTADÍSTICAS */}
      <div className="max-w-xl mx-auto bg-card rounded-xl p-6 mb-6 shadow flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg">Estadísticas</span>
        </div>

        <div className="grid grid-cols-3 gap-4 ">
          {/* ⭐️ Horas transmitidas reales */}
          <div>
            <span className="font-bold text-xl">
              {horas}h {minutos}m
            </span>
            <div className="text-xs text-muted-foreground">
              Horas transmitidas
            </div>
          </div>
        </div>
      </div>

      {/* REGALOS */}
      <div className="max-w-xl mx-auto bg-card rounded-xl p-6 mb-8">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" /> Regalos del canal
        </h3>

        {/* Form */}
        <form onSubmit={handleSaveRegalo} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nombre"
            className="border rounded px-2 py-1 bg-background text-foreground"
            value={nuevoRegalo.nombre}
            onChange={(e) =>
              setNuevoRegalo({ ...nuevoRegalo, nombre: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Costo"
            className="border rounded px-2 py-1 w-20 bg-background text-foreground"
            value={nuevoRegalo.costo}
            onChange={(e) =>
              setNuevoRegalo({ ...nuevoRegalo, costo: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Puntos"
            className="border rounded px-2 py-1 w-20 bg-background text-foreground"
            value={nuevoRegalo.puntos}
            onChange={(e) =>
              setNuevoRegalo({ ...nuevoRegalo, puntos: e.target.value })
            }
          />
          <Button type="submit" size="sm" variant="secondary">
            {editId ? <Edit className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          </Button>
        </form>

        {/* Lista de regalos */}
        {loading ? (
          <p>Cargando...</p>
        ) : regalos.length === 0 ? (
          <p>No hay regalos creados.</p>
        ) : (
          regalos.map((r) => (
            <div key={r.id_regalo} className="flex items-center gap-2 mb-2">
              <span className="font-semibold">{r.nombre}</span>
              <span className="text-xs text-muted-foreground">
                Costo: {r.costo_monedas}
              </span>
              <span className="text-xs text-muted-foreground">
                Puntos: {r.puntos_otorgados}
              </span>
              <Button size="icon" variant="ghost" onClick={() => handleEdit(r)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(r.id_regalo)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Studio;
