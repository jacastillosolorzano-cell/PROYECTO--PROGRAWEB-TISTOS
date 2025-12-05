// src/pages/Profile.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";

import {
  ArrowLeft,
  Menu,
  Wallet,
  UserPlus,
  ArrowRight,
  Star,
  Gem,
  Zap,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useUser } from "../hooks/use-user";
import { useToast } from "../hooks/use-toast";
import { formatPoints } from "../lib/utils";
import { BACKEND_URL } from "@/config";
import HeaderSaldo from "@/components/HeaderSaldo";

// ===============================
//  Progreso por canal (desde backend)
// ===============================
function ChannelProgress({ userId }: { userId?: string | null }) {
  const [progresos, setProgresos] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/usuarios/${userId}/progreso`);
        if (!res.ok) {
          console.warn(
            "No se pudo obtener progreso desde backend",
            await res.text()
          );
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setProgresos(data || []);
      } catch (e) {
        console.error("Error al obtener progreso:", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  if (!progresos || progresos.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold mb-2">Progreso por canal</h4>
      <div className="space-y-3">
        {progresos.map((p) => {
          const nivel = p.nivel;
          const streamer = p.streamer;
          const puntos_actuales = p.puntos_actuales || 0;
          const puntos_requeridos = nivel?.puntos_requeridos ?? 1000;
          const faltan = Math.max(puntos_requeridos - puntos_actuales, 0);
          const porcentaje = Math.min(
            Math.round((puntos_actuales / puntos_requeridos) * 100),
            100
          );
          return (
            <div key={p.id_progreso} className="bg-muted p-3 rounded">
              <div className="flex justify-between text-xs mb-1">
                <div className="font-medium">
                  {streamer?.nombre ||
                    streamer?.id_usuario ||
                    "Streamer"}
                </div>
                <div className="text-muted-foreground">
                  {puntos_actuales} / {puntos_requeridos}
                </div>
              </div>
              <div className="w-full bg-black/10 rounded-full h-2 mb-1">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Faltan {faltan} puntos para "
                {nivel?.nombre_nivel || "siguiente nivel"}"
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===============================
//  Página de Perfil
// ===============================
const Profile = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const { user } = useUser();
  const { toast } = useToast();

  // Usuario real del backend (guardado en login)
  const rawBackendUser = localStorage.getItem("usuario");
  const backendUser = rawBackendUser
    ? (JSON.parse(rawBackendUser) as {
        id_usuario: string;
        nombre: string;
        email: string;
        rol: string;
      })
    : null;

  // Mock de estadísticas sociales (no están en backend, los dejamos fake)
  const usuarioMock = {
    avatar:
      "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/af/ba/26/afba2629-ac1e-01c3-dce7-293a45a2bc48/AppIcon-0-1x_U007epad-0-1-0-85-220-0.png/230x0w.webp",
    seguidores: 999,
    seguidos: 999,
    meGusta: 999,
  };

  const displayName =
    backendUser?.nombre ?? user?.name ?? "ulima123";

  // === Descripción guardada en localStorage (frontend only) ===
  const storageKey = `profile_description_${displayName}`;
  const [description, setDescription] = useState<string>("");
  const [editing, setEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setDescription(saved);
  }, [storageKey]);

  const openEditor = () => {
    setDraft(description);
    setEditing(true);
  };

  const saveDescription = () => {
    const trimmed = draft.trim();
    setDescription(trimmed);
    localStorage.setItem(storageKey, trimmed);
    setEditing(false);
    toast({
      title: "Descripción guardada",
      description: trimmed
        ? "Tu descripción se actualizó correctamente."
        : "Descripción eliminada.",
      duration: 2500,
    });
  };

  const cancelEdit = () => {
    setDraft("");
    setEditing(false);
  };

  // === Progreso general (resumen) desde backend ===
  interface ResumenProgreso {
    puntos: number;
    puntosRequeridos: number;
    nivelNombre: string;
    streamerNombre?: string;
  }

  const [resumen, setResumen] = useState<ResumenProgreso | null>(null);
  const [cargandoProgreso, setCargandoProgreso] = useState(false);

  useEffect(() => {
    const cargarProgreso = async () => {
      if (!backendUser?.id_usuario) return;
      try {
        setCargandoProgreso(true);
        const resp = await fetch(
          `${BACKEND_URL}/usuarios/${backendUser.id_usuario}/progreso`
        );
        if (!resp.ok) {
          console.warn("No se pudo cargar progreso general");
          return;
        }
        const progresos: any[] = await resp.json();

        if (!progresos || progresos.length === 0) {
          setResumen(null);
          return;
        }

        // Tomamos el progreso donde tenga más puntos como “principal”
        const best = progresos.reduce((prev, curr) =>
          (curr.puntos_actuales || 0) > (prev.puntos_actuales || 0)
            ? curr
            : prev
        );

        const puntos = best.puntos_actuales || 0;
        const puntosRequeridos =
          best.nivel?.puntos_requeridos ?? 1000;
        const nivelNombre =
          best.nivel?.nombre_nivel ?? "Nuevo";
        const streamerNombre =
          best.streamer?.nombre || best.streamer?.id_usuario;

        setResumen({
          puntos,
          puntosRequeridos,
          nivelNombre,
          streamerNombre,
        });
      } catch (e) {
        console.error("Error cargando progreso general:", e);
      } finally {
        setCargandoProgreso(false);
      }
    };

    cargarProgreso();
  }, [backendUser?.id_usuario]);

  const puntos = resumen?.puntos ?? 0;
  const puntosRequeridos = resumen?.puntosRequeridos ?? 1000;
  const faltan = Math.max(puntosRequeridos - puntos, 0);
  const porcentaje = Math.min(
    Math.round((puntos / puntosRequeridos) * 100),
    100
  );

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Botón de regresar */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-10"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      <HeaderSaldo/>

      {/* Botón de menú */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10"
        onClick={() => setShowMenu(!showMenu)}
      >
        <Menu className="w-6 h-6" />
      </Button>

      {/* Menú desplegable */}
      {showMenu && (
        <div className="fixed top-0 right-0 h-full w-56 bg-card shadow-lg z-20 flex flex-col pt-16 animate-slide-in">
          <Button
            variant="ghost"
            className="justify-start w-full px-6 py-4 text-left"
            onClick={() => {
              setShowMenu(false);
              navigate("/saldo");
            }}
          >
            <Wallet className="w-5 h-5 mr-2" />
            Ver saldo
          </Button>

          {/* Cerrar sesión */}
          <LogoutButton/>
          <Button
            variant="ghost"
            className="justify-start w-full px-6 py-4 text-left"
            onClick={() => setShowMenu(false)}
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            Volver a perfil
          </Button>
        </div>
      )}

      {/* Perfil */}
      <div className="flex flex-col items-center pt-16 pb-4">
        {/* Imagen de perfil */}
        <div className="relative">
          <img
            src={usuarioMock.avatar}
            alt="avatar"
            className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-0 right-0 rounded-full"
            title="Agregar foto"
          >
            <UserPlus className="w-5 h-5" />
          </Button>
        </div>
        {/* Nombre de usuario */}
        <div className="mt-2 text-lg font-semibold">
          @{displayName}
        </div>
        {backendUser?.email && (
          <div className="text-xs text-muted-foreground">
            {backendUser.email}
          </div>
        )}

        {/* Descripción (si existe) */}
        {description ? (
          <p className="mt-2 text-center max-w-xl text-sm text-muted-foreground px-4">
            {description}
          </p>
        ) : null}

        {/* Botón para agregar/editar descripción */}
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={openEditor}>
            {description ? "Editar descripción" : "+ Agregar descripción"}
          </Button>
        </div>
      </div>

      {/* Estadísticas sociales (mock) */}
      <div className="flex justify-center gap-8 mb-4">
        <div className="flex flex-col items-center">
          <span className="font-bold">{usuarioMock.seguidos}</span>
          <span className="text-xs text-muted-foreground">
            Siguiendo
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold">{usuarioMock.seguidores}</span>
          <span className="text-xs text-muted-foreground">
            Seguidores
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold">{usuarioMock.meGusta}</span>
          <span className="text-xs text-muted-foreground">
            Me gusta
          </span>
        </div>
      </div>

      {/* Mi Progreso (desde backend) */}
      <div className="mx-4 mb-4 bg-card rounded-lg p-4 shadow-sm border">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Mi Progreso
        </h3>

        {cargandoProgreso ? (
          <p className="text-sm text-muted-foreground">
            Cargando progreso...
          </p>
        ) : resumen ? (
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <strong>Nombre:</strong> {displayName}
            </p>
            {resumen.streamerNombre && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                Principal en canal: {resumen.streamerNombre}
              </p>
            )}
            <p className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <strong>Nivel:</strong> {resumen.nivelNombre}
            </p>
            <p className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-green-500" />
              <strong>Puntos:</strong> {formatPoints(puntos)}
            </p>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progreso al siguiente nivel</span>
                <span>
                  {puntos} / {puntosRequeridos}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Próximo nivel en {faltan} puntos.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aún no tienes puntos. Participa en chats, envía regalos o
            juega a la ruleta para empezar a subir de nivel.
          </p>
        )}

        {/* Progreso por canal (detalle) */}
        <ChannelProgress userId={backendUser?.id_usuario} />
      </div>

      {/* Link a Tistos Studio */}
      <div className="flex justify-center mb-2">
        <Button asChild variant="secondary">
          <Link to="/studio">
            <span className="inline-flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Tistos Studio
            </span>
          </Link>
        </Button>
      </div>

      {/* Modal editor de descripción */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={cancelEdit}
          />
          <div className="relative bg-[#151515] p-6 rounded-lg shadow-xl w-[min(720px,92%)] border border-purple-800">
            <h3 className="text-lg font-bold mb-3">
              Editar descripción
            </h3>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              className="w-full bg-card p-3 rounded-md text-white outline-none"
              placeholder="Describe tu canal, horarios, enlaces... (máx 300 caracteres)"
              maxLength={300}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={cancelEdit}>
                Cancelar
              </Button>
              <Button onClick={saveDescription}>Guardar</Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto">
        <BottomNav />
      </div>
    </div>
  );
};

export default Profile;
