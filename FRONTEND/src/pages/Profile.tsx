import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu, LogOut, Wallet, UserPlus, ArrowRight, Star, Gem, Zap } from "lucide-react"; // NUEVO: Agregué icons para nivel/puntos
import BottomNav from "@/components/BottomNav";
import { useUser } from "../hooks/use-user"; // NUEVO: Import del hook
import { useToast } from "../hooks/use-toast"; // NUEVO: Import para notificaciones
import { formatPoints } from "../lib/utils"; // NUEVO: Para formatear puntos (de Paso 1)
import LogOutButton from "@/pages/ventanas/LogOutButton"

const Profile = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  // NUEVO: Usa el hook para datos reales de usuario (nivel, puntos)
  const { user, updatePoints } = useUser();
  const { toast } = useToast(); // NUEVO: Para level up notifications

  // Datos simulados existentes (mantengo para avatar, stats; puedes fusionar con 'user' más adelante)
  const usuario = {
    nombre: "ulima123",
    avatar: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/af/ba/26/afba2629-ac1e-01c3-dce7-293a45a2bc48/AppIcon-0-1x_U007epad-0-1-0-85-220-0.png/230x0w.webp", // ...existing avatar...
    seguidores: 999,
    seguidos: 999,
    meGusta: 999,
  };

  // === Nueva lógica para descripción ===
  const storageKey = `profile_description_${user?.name ?? usuario.nombre}`;
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
      description: trimmed ? "Tu descripción se actualizó correctamente." : "Descripción eliminada.",
      duration: 2500,
    });
  };

  const cancelEdit = () => {
    setDraft("");
    setEditing(false);
  };
  // === Fin lógica descripción ===

  // NUEVO: Función para ganar puntos (integra con toast para level up)
  const handleGainPoints = () => {
    const result = updatePoints?.("login"); // Ejemplo: gana 100 puntos por "actualizar perfil"
    toast({
      title: "¡Progreso Actualizado!",
      description: `Ganaste 100 puntos. Total: ${formatPoints((user?.points ?? 0) + 100)} 💎`,
      duration: 3000,
    });
    if (result?.didLevelUp) {
      toast({
        title: "¡Felicidades! 🎉",
        description: `Has subido al Nivel ${result.newLevel}! Sigue participando para más recompensas.`,
        duration: 4000,
      });
    }
  };

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
          {/*Cerrar sesion */}
          <LogOutButton/>

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
            src={usuario.avatar}
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
        <div className="mt-2 text-lg font-semibold">@{usuario.nombre}</div>

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

      {/* Estadísticas existentes */}
      <div className="flex justify-center gap-8 mb-4">
        <div className="flex flex-col items-center">
          <span className="font-bold">{usuario.seguidos}</span>
          <span className="text-xs text-muted-foreground">Siguiendo</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold">{usuario.seguidores}</span>
          <span className="text-xs text-muted-foreground">Seguidores</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold">{usuario.meGusta}</span>
          <span className="text-xs text-muted-foreground">Me gusta</span>
        </div>
      </div>

      
      <div className="mx-4 mb-4 bg-card rounded-lg p-4 shadow-sm border">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Mi Progreso
        </h3>
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <strong>Nombre:</strong> {user?.name ?? usuario.nombre} 
          </p>
          <p className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <strong>Nivel:</strong> {user?.level ?? 1}
          </p>
          <p className="flex items-center gap-2">
            <Gem className="w-4 h-4 text-green-500" />
            <strong>Puntos:</strong> {formatPoints(user?.points ?? 0)}
          </p>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progreso al siguiente nivel</span>
              <span>{(user?.points ?? 0) % 1000} / 1000</span> 
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(((user?.points ?? 0) % 1000) / 10, 100)}%` }} 
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Próximo nivel en {1000 - ((user?.points ?? 0) % 1000)} puntos.
            </p>
          </div>
        </div>
        
        <Button 
          onClick={handleGainPoints}
          className="w-full mt-3 flex items-center gap-2"
          variant="default"
        >
          <Zap className="w-4 h-4" />
          Actualizar Progreso (Gana 100 pts)
        </Button>
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
          <div className="absolute inset-0 bg-black/60" onClick={cancelEdit} />
          <div className="relative bg-[#151515] p-6 rounded-lg shadow-xl w-[min(720px,92%)] border border-purple-800">
            <h3 className="text-lg font-bold mb-3">Editar descripción</h3>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              className="w-full bg-card p-3 rounded-md text-white outline-none"
              placeholder="Describe tu canal, horarios, enlaces... (máx 300 caracteres)"
              maxLength={300}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={cancelEdit}>Cancelar</Button>
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
