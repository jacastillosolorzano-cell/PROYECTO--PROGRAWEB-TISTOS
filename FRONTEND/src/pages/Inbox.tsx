import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Users } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import ChatList from "../components/ChatList";
import HeaderSaldo from "../components/HeaderSaldo";
import { BACKEND_URL } from "@/config";

interface ChatItem {
  id: number;
  nombre: string;
  mensaje: string;
  avatar?: string;
  level?: number;
}

interface Notificacion {
  id_notificacion: string;
  tipo: string;
  mensaje: string;
  leido: boolean;
  fecha_hora: string;
}

const chats: ChatItem[] = [
  {
    id: 1,
    nombre: "Juler1",
    mensaje: "Se envió ayer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Allison",
    level: 3,
  },
  {
    id: 2,
    nombre: "Hernan2",
    mensaje: "JAJAJAJAJAJA",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lexandra",
    level: 7,
  },
  {
    id: 3,
    nombre: "Fiorella",
    mensaje: "Visto",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Boom",
    level: 5,
  },
];

const Inbox: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.mensaje.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.leido).length,
    [notifications]
  );

  const handleChatClick = (chat: ChatItem) => {
    navigate(`/chat/${chat.id}`, { state: { chat } });
  };

  const handleSearchEnter = (filtered: ChatItem[]) => {
    const c = filtered[0];
    if (!c) return;
    navigate(`/chat/${c.id}`, { state: { chat: c } });
  };

  // ==============================
  //   Cargar notificaciones backend
  // ==============================
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        setLoadingNotifs(true);

        const resp = await fetch(`${BACKEND_URL}/notificaciones`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!resp.ok) {
          console.warn("No se pudieron cargar las notificaciones");
          return;
        }

        const data: Notificacion[] = await resp.json();
        setNotifications(data);
      } catch (error) {
        console.error("Error obteniendo notificaciones:", error);
      } finally {
        setLoadingNotifs(false);
      }
    };

    fetchNotifications();
  }, []);

  // ==============================
  //   Marcar notificación como leída
  // ==============================
  const handleMarkAsRead = async (id_notificacion: string) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const resp = await fetch(
        `${BACKEND_URL}/notificaciones/${id_notificacion}/leido`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!resp.ok) {
        console.warn("No se pudo marcar notificación como leída");
        return;
      }

      setNotifications((prev) =>
        prev.map((n) =>
          n.id_notificacion === id_notificacion
            ? { ...n, leido: true }
            : n
        )
      );
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* HEADER */}
      <div className="flex items-center gap-2 p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex-1 flex items-center justify-center">
          {!searchOpen ? (
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">Mensajes</h2>
              <HeaderSaldo />
            </div>
          ) : null}
        </div>

        <SearchBar
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onEnter={handleSearchEnter}
          filteredChats={filteredChats}
        />
      </div>

      {/* CONTENIDO */}
      <div className="px-6 space-y-4">
        {/* Avatares rápidos */}
        <div className="flex gap-4 mb-2">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-white text-xl font-bold">
              U
            </div>
            <span className="text-xs mt-1">Crear</span>
          </div>
          <div className="flex flex-col items-center">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sebastian"
              alt="Sebastian"
              className="w-14 h-14 rounded-full border-2 border-primary"
            />
            <span className="text-xs mt-1">Andrea</span>
          </div>
          <div className="flex flex-col items-center">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Billy"
              alt="Billy"
              className="w-14 h-14 rounded-full border-2 border-primary"
            />
            <span className="text-xs mt-1">Billy</span>
          </div>
          <div className="flex flex-col items-center">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=ElCarlin"
              alt="ElCarlin"
              className="w-14 h-14 rounded-full border-2 border-primary"
            />
            <span className="text-xs mt-1">Jim</span>
          </div>
        </div>

        {/* Sección actividad / notificaciones */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-semibold">Nuevos seguidores</span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="relative">
              <Bell className="w-5 h-5 text-pink-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full px-1">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="font-semibold">Actividad</span>
          </div>

          {/* Lista de notificaciones */}
          <div className="space-y-2 mt-2">
            {loadingNotifs && (
              <p className="text-xs text-muted-foreground">
                Cargando actividad...
              </p>
            )}

            {!loadingNotifs && notifications.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No tienes actividad reciente.
              </p>
            )}

            {!loadingNotifs &&
              notifications.map((n) => (
                <div
                  key={n.id_notificacion}
                  className={`p-3 rounded-lg bg-card border flex items-start justify-between gap-3 ${
                    !n.leido ? "border-primary" : "border-border"
                  }`}
                >
                  <div>
                    <p className="text-sm">{n.mensaje}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.fecha_hora).toLocaleString()}
                    </p>
                  </div>
                  {!n.leido && (
                    <button
                      className="text-xs text-primary underline"
                      onClick={() => handleMarkAsRead(n.id_notificacion)}
                    >
                      Marcar como leída
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Lista de chats (mock por ahora) */}
        <ChatList chats={filteredChats} onChatClick={handleChatClick} />
      </div>

      <div className="mt-auto">
        <BottomNav />
      </div>
    </div>
  );
};

export default Inbox;
