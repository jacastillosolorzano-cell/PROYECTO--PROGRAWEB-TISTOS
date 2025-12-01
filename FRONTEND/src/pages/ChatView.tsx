import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Gift } from "lucide-react";
import RouletteModal from "@/components/RouletteModal";
import OverlayAnimator from "@/components/OverlayAnimator";
import { useToast } from "../hooks/use-toast";
import { BACKEND_URL } from "@/config"

interface Chat {
  id: number | string;
  nombre: string;
  avatar?: string;
  level?: number;
}

interface Message {
  id: string;
  text: string;
  user: { nombre: string };
  timestamp: string;
}

const DEFAULT_GIFTS = [
  { id: 1, nombre: "Dina", costo: 10, puntos: 100 },
  { id: 2, nombre: "Tomba", costo: 2, puntos: 20 }
];

const ROULETTE_COST = 100; // puntos necesarios para jugar

const ChatView: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const params = useParams();
  const chat: Chat | undefined = (state as any)?.chat;
  const chatId = params.id ?? (chat?.id ?? "unknown");
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>(() => [
    { id: "1", text: "Hola, ¿qué tal?", user: { nombre: chat?.nombre ?? "Contacto" }, timestamp: new Date().toISOString() },
  ]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // roulette
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [selectedGift] = useState(DEFAULT_GIFTS[0]); // si quieres integrar regalos vs ruleta, puedes expandir

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  // helper: obtener y persistir usuario actual
  const getCurrentUser = () => {
    const raw = localStorage.getItem("tistos_current_user");
    return raw ? JSON.parse(raw) : null;
  };
  const persistCurrentUser = (u: any) => {
    localStorage.setItem("tistos_current_user", JSON.stringify(u));
    // también actualizar en lista de usuarios si existe
    try {
      const raw = localStorage.getItem("tistos_users");
      const users = raw ? JSON.parse(raw) : [];
      const idx = users.findIndex((x: any) => x.email === u.email || x.id === u.id);
      if (idx >= 0) {
        users[idx] = u;
        localStorage.setItem("tistos_users", JSON.stringify(users));
      }
    } catch (e) { /* ignore */ }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    const newMsg: Message = { id: Date.now().toString(), text: text.trim(), user: { nombre: "Yo" }, timestamp: new Date().toISOString() };
    setMessages(m => [...m, newMsg]);
    setText("");
    toast?.({ title: "Ganaste 1 punto", duration: 1000 });

    // sumar 1 punto por mensaje al usuario actual
    const currentUser = getCurrentUser();
    if (currentUser) {
      currentUser.points = (currentUser.points ?? 0) + 100;
      persistCurrentUser(currentUser);
    }
  };

  const handleRouletteResult = (rewardCoins: number) => {
    // Hacer la petición al backend para registrar la jugada
    const u = getCurrentUser();
    if (!u) {
      toast?.({ title: "Inicia sesión para jugar", duration: 2000 });
      return;
    }

    // Llamar al backend para procesar la jugada
    fetch(`${BACKEND_URL}/ruleta/jugar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_espectador: u.id_usuario,
        puntos_apostados: ROULETTE_COST,
        id_streamer: chat?.id || null
      })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(error => {
            throw new Error(error.error || "Error al procesar la ruleta");
          });
        }
        return res.json();
      })
      .then(data => {
        // Actualizar el usuario con las nuevas monedas y puntos
        u.coins = (u.coins ?? 0) + data.monedas_ganadas;
        u.points = (u.points ?? 0) - ROULETTE_COST;
        persistCurrentUser(u);

        // Mostrar overlay con la recompensa
        window.dispatchEvent(new CustomEvent("tistos:overlay", {
          detail: {
            type: "gift",
            from: u.nombre ?? u.email ?? "Anon",
            giftName: `Ruleta (+${data.monedas_ganadas} monedas)`,
            points: data.monedas_ganadas,
            multiplier: 0
          }
        }));

        toast?.({ 
          title: `¡Ganaste ${data.monedas_ganadas} monedas!`, 
          description: `Resultado: ${data.resultado_segmento}`,
          duration: 2000 
        });
      })
      .catch(error => {
        toast?.({ title: error.message || "Error al procesar la ruleta", duration: 2000 });
        console.error(error);
      });
  };

  const currentUser = getCurrentUser();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <OverlayAnimator />
      <div className="flex items-center gap-2 p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          {chat?.avatar ? <img src={chat.avatar} alt={chat.nombre} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white">U</div>}
          <div>
            <div className="font-semibold">{chat?.nombre ?? `Chat ${chatId}`}</div>
            <div className="text-xs text-muted-foreground">Nivel {chat?.level ?? "-"}</div>
          </div>
        </div>

        {/* Mostrar puntos/monedas del usuario en el header */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ color: "#fff", fontWeight: 700 }}>{currentUser?.coins ?? 0} 💰</div>
          <div style={{ color: "#cfc" }}>{currentUser?.points ?? 0} pts</div>
        </div>
      </div>

      <div className="flex-1 px-4 overflow-y-auto">
        <div className="mt-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.user.nombre === "Yo" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] px-3 py-2 rounded-lg ${m.user.nombre === "Yo" ? "bg-primary text-white" : "bg-card text-white"}`}>
                <div className="text-sm">{m.text}</div>
                <div className="text-[10px] text-muted-foreground mt-1 text-right">{new Date(m.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

       
        <div className="fixed bottom-20 left-4 right-4 bg-transparent">
          {/* Botón para abrir la ruleta (usa puntos) */}
          <button
            onClick={() => {
              const u = getCurrentUser();
              if (!u) {
                toast?.({ title: "Inicia sesión para jugar", duration: 2000 });
                return;
              }
              if ((u.points ?? 0) < ROULETTE_COST) {
                toast?.({ title: `Necesitas ${ROULETTE_COST} pts para jugar`, duration: 2200 });
                return;
              }
              setRouletteOpen(true);
            }}
            style={{
              background: "linear-gradient(90deg,#ff66cc,#7b2cff)",
              border: "none",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 12,
              fontWeight: 800,
              cursor: "pointer"
            }}
            title={`Jugar ruleta (${ROULETTE_COST} pts)`}
          >
            🎯 Ruleta ({ROULETTE_COST} pts)
          </button>
        </div>


      <div className="fixed bottom-4 left-4 right-4 bg-transparent">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          
          <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
            
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 rounded-2xl px-4 py-2 bg-card text-white outline-none"
              placeholder="Escribe un mensaje..."
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            />
            <Button onClick={handleSend} size="sm" variant="secondary">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        
        </div>
      </div>

      <RouletteModal
        open={rouletteOpen}
        costPoints={ROULETTE_COST}
        userPoints={currentUser?.points ?? 0}
        onClose={() => setRouletteOpen(false)}
        onResult={(rewardCoins) => {
          setRouletteOpen(false);
          handleRouletteResult(rewardCoins);
        }}
      />
    </div>
  );
};

export default ChatView;