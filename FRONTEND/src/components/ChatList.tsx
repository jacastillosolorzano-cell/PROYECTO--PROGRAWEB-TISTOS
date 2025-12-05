import React from "react";
import { MessageSquare, Star } from "lucide-react";

export interface ChatItem {
  id: string;
  nombre: string;
  mensaje: string;
  avatar?: string;
  level?: number;
}

interface ChatListProps {
  chats: ChatItem[];
  onChatClick: (chat: ChatItem) => void;
}

const ChatList: React.FC<ChatListProps> = ({ chats, onChatClick }) => {
  return (
    <div>
      {chats.map((chat) => (
        <div
          key={chat.id}
          className="flex items-center gap-3 py-2 border-b border-border cursor-pointer hover:bg-muted rounded p-2"
          onClick={() => onChatClick(chat)}
        >
          {chat.avatar ? (
            <img
              src={chat.avatar}
              alt={chat.nombre}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold">
              {chat.nombre.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <div className="font-semibold text-sm flex items-center gap-1">
              {chat.nombre}
              {typeof chat.level === "number" && (
                <>
                  <span className="text-xs text-muted-foreground">
                    · Nivel {chat.level}
                  </span>
                  <Star className="w-3 h-3 text-yellow-500" />
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{chat.mensaje}</div>
          </div>

          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </div>
      ))}

      {chats.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          No se encontraron conversaciones.
        </div>
      )}
    </div>
  );
};

export default ChatList;
