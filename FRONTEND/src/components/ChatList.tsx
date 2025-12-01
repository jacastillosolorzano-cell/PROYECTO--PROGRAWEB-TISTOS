import React from 'react';
import { MessageSquare, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChatItem {
  id: number;
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
  const navigate = useNavigate();

  return (
    <div>
      {chats.map(chat => (
        <div
          key={chat.id}
          className="flex items-center gap-3 py-2 border-b border-border cursor-pointer hover:bg-muted rounded p-2"
          onClick={() => {
            onChatClick(chat);
            navigate(`/chat/${chat.id}`, { state: { chat } });
          }}
        >
          <img src={chat.avatar} alt={chat.nombre} className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <div className="font-semibold text-sm flex items-center gap-1">
              {chat.nombre} - Nivel {chat.level}
              <Star className="w-3 h-3 text-yellow-500" />
            </div>
            <div className="text-xs text-muted-foreground">{chat.mensaje}</div>
          </div>
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </div>
      ))}

      {chats.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">No se encontraron conversaciones.</div>
      )}
    </div>
  );
};

export default ChatList;