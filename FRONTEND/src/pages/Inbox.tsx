import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Users } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/use-user";
import { useToast } from "../hooks/use-toast";
import SearchBar from "../components/SearchBar";
import ChatList from "../components/ChatList";
import HeaderSaldo from "../components/HeaderSaldo";

interface ChatItem {
  id: number;
  nombre: string;
  mensaje: string;
  avatar?: string;
  level?: number;
}

const chats: ChatItem[] = [
  { id: 1, nombre: "Juler1", mensaje: "Se envió ayer", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Allison", level: 3 },
  { id: 2, nombre: "Hernan2", mensaje: "JAJAJAJAJAJA", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lexandra", level: 7 },
  { id: 3, nombre: "Fiorella", mensaje: "Visto", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Boom", level: 5 },
];

const Inbox: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const [openChatId, setOpenChatId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(c =>
      c.nombre.toLowerCase().includes(q) || c.mensaje.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleChatClick = (chat: ChatItem) => {
    setOpenChatId(chat.id);
  };

  const handleSearchEnter = (filtered: ChatItem[]) => {
    const c = filtered[0];
    navigate(`/chat/${c.id}`, { state: { chat: c } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
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

      <div className="px-6">
        <div className="flex gap-4 mb-4">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-white text-xl font-bold">U</div>
            <span className="text-xs mt-1">Crear</span>
          </div>
          <div className="flex flex-col items-center">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sebastian" alt="Sebastian" className="w-14 h-14 rounded-full border-2 border-primary" />
            <span className="text-xs mt-1">Andrea</span>
          </div>
          <div className="flex flex-col items-center">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Billy" alt="Billy" className="w-14 h-14 rounded-full border-2 border-primary" />
            <span className="text-xs mt-1">Billy</span>
          </div>
          <div className="flex flex-col items-center">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=ElCarlin" alt="ElCarlin" className="w-14 h-14 rounded-full border-2 border-primary" />
            <span className="text-xs mt-1">Jim</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-semibold">Nuevos seguidores</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-pink-500" />
            <span className="font-semibold">Actividad</span>
          </div>
        </div>

        <ChatList chats={filteredChats} onChatClick={handleChatClick} />
      </div>

      <div className="mt-auto">
        <BottomNav />
      </div>
    </div>
  );
};

export default Inbox;