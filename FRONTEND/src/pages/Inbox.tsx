import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Plus } from "lucide-react"; // Importé Plus para el icono de Crear
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import ChatList, { ChatItem } from "../components/ChatList";
import HeaderSaldo from "../components/HeaderSaldo";
import { BACKEND_URL } from "@/config";

interface Notificacion {
  id_notificacion: string;
  tipo: string;
  mensaje: string;
  leido: boolean;
  fecha_hora: string;
}

// Lista de avatares para asignar visualmente si el usuario no tiene foto real
const AVATAR_LIST = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Simba",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jazmin",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=George",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Willow",
];

const Inbox: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);

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
  }, [searchQuery, chats]);

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
  //  Cargar Chats del Backend
  // ==============================
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const usuarioRaw = localStorage.getItem("usuario");
        if (!usuarioRaw) return;
        
        const usuario = JSON.parse(usuarioRaw);
        setLoadingChats(true);

        const resp = await fetch(`${BACKEND_URL}/chats/lista/${usuario.id_usuario}`);
        
        if (resp.ok) {
          const data: any[] = await resp.json();
          
          const mappedChats: ChatItem[] = data.map((c, index) => ({
            id: c.id,
            nombre: c.nombre,
            mensaje: c.mensaje,
            level: c.level,
            // Asignamos avatar rotativo
            avatar: AVATAR_LIST[index % AVATAR_LIST.length], 
          }));

          setChats(mappedChats);
        } else {
          console.warn("Error al cargar chats");
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoadingChats(false);
      }
    };

    fetchChats();
  }, []);

  // ==============================
  //  Cargar notificaciones
  // ==============================
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        setLoadingNotifs(true);

        const resp = await fetch(`${BACKEND_URL}/notificaciones`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resp.ok) {
          const data: Notificacion[] = await resp.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error("Error obteniendo notificaciones:", error);
      } finally {
        setLoadingNotifs(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id_notificacion: string) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const resp = await fetch(
        `${BACKEND_URL}/notificaciones/${id_notificacion}/leido`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (resp.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id_notificacion === id_notificacion
              ? { ...n, leido: true }
              : n
          )
        );
      }
    } catch (error) {
      console.error("Error marcando notificación:", error);
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
      
      <HeaderSaldo />
      
      {/* CONTENIDO */}
      <div className="px-6 space-y-4">
        
        {/* ======================================================== */}
        {/* BARRA DE USUARIOS (Historias) - AHORA REAL Y CLICKEABLE */}
        {/* ======================================================== */}
        <div className="flex gap-4 mb-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* Botón estático de "Crear" o "Tu historia" */}
          <div className="flex flex-col items-center min-w-[56px] cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-white relative">
               <Plus className="w-6 h-6" />
               {/* Badge opcional */}
               <div className="absolute bottom-0 right-0 bg-primary w-4 h-4 rounded-full border-2 border-background flex items-center justify-center text-[10px] text-white">
                 +
               </div>
            </div>
            <span className="text-xs mt-1 truncate w-14 text-center">Crear</span>
          </div>

           {/* Usuarios Reales cargados desde el backend */}
           {chats.map((chat) => (
             <div 
               key={chat.id} 
               className="flex flex-col items-center min-w-[56px] cursor-pointer hover:scale-105 transition-transform"
               onClick={() => handleChatClick(chat)} // <--- Acción de click
             >
               {chat.avatar ? (
                 <img
                   src={chat.avatar}
                   alt={chat.nombre}
                   className="w-14 h-14 rounded-full border-2 border-primary object-cover"
                 />
               ) : (
                 <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xs font-bold border-2 border-primary">
                    {chat.nombre.substring(0, 2).toUpperCase()}
                 </div>
               )}
               <span className="text-xs mt-1 truncate w-14 text-center text-muted-foreground">
                 {chat.nombre.split(" ")[0]} {/* Solo mostramos primer nombre para que quepa */}
               </span>
             </div>
           ))}
           
           {/* Estado de carga pequeño para la barra superior */}
           {loadingChats && chats.length === 0 && (
             <div className="flex items-center justify-center min-w-[56px] h-14">
               <span className="text-xs text-muted-foreground animate-pulse">...</span>
             </div>
           )}
        </div>

        {/* Sección actividad / notificaciones */}
        <div className="mb-4">
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

          <div className="space-y-2 mt-2">
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
                      Leída
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Lista de chats completa */}
        <div className="mb-2">
          <h3 className="font-bold mb-2">Chats Recientes</h3>
          {loadingChats ? (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
          ) : filteredChats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aún no sigues a ningún streamer o no has interactuado.
            </p>
          ) : (
            <ChatList chats={filteredChats} onChatClick={handleChatClick} />
          )}
        </div>
      </div>

      <div className="mt-auto">
        <BottomNav />
      </div>
    </div>
  );
};

export default Inbox;