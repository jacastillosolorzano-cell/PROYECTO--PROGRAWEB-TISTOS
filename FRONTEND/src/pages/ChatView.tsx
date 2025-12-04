import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import RouletteModal from "@/components/RouletteModal";
import OverlayAnimator from "@/components/OverlayAnimator";
import { useToast } from "../hooks/use-toast";
import { BACKEND_URL } from "@/config";
import { useSaldo } from "@/contexts/SaldoContext";

interface Chat {
  id: string;            // 👈 aquí vamos a asumir que es el id_streamer
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

const ROULETTE_COST = 100; // puntos necesarios para jugar (backend igual)

const ChatView: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const params = useParams();
  const chat: Chat | undefined = (state as any)?.chat;
  const chatId = params.id ?? (chat?.id ?? "unknown"); // usamos esto como id_sesion SOLO para UI
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "1",
      text: "Hola, ¿qué tal?",
      user: { nombre: chat?.nombre ?? "Contacto" },
      timestamp: new Date().toISOString(),
    },
  ]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Ruleta
  const [rouletteOpen, setRouletteOpen] = useState(false);

  // Puntos reales del espectador (desde backend /progreso)
  const [userPoints, setUserPoints] = useState<number>(0);

  // Saldo de monedas desde el contexto (backend)
  const { saldo, refrescarSaldo } = useSaldo();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============================
  //  Usuario logueado (backend)
  // ============================
  const getCurrentUser = () => {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) as { id_usuario: string; nombre: string; email: string } : null;
  };

  const currentUser = getCurrentUser();

  // ============================
  //  Cargar puntos desde backend
  // ============================
  useEffect(() => {
    const fetchPoints = async () => {
      if (!currentUser) return;

      try {
        // /usuarios/:id_usuario/progreso devuelve array de progresos
        const resp = await fetch(
          `${BACKEND_URL}/usuarios/${currentUser.id_usuario}/progreso`
        );
        if (!resp.ok) return;
        const data: any[] = await resp.json();

        // Si el chat está asociado a un streamer concreto, filtramos por él
        if (chat?.id) {
          const prog = data.find((p) => p.id_streamer === chat.id);
          setUserPoints(prog?.puntos_actuales ?? 0);
        } else {
          // Si no hay streamer asociado, sumamos todos los puntos
          const total = data.reduce(
            (acc, p) => acc + (p.puntos_actuales ?? 0),
            0
          );
          setUserPoints(total);
        }
      } catch (e) {
        console.error("Error obteniendo progreso del usuario:", e);
      }
    };

    fetchPoints();
  }, [currentUser, chat?.id]);

  // ============================
  //  Enviar mensaje
  // ============================
  const handleSend = async () => {
    if (!text.trim()) return;
    const contenido = text.trim();

    const usuario = getCurrentUser();
    if (!usuario) {
      toast?.({
        title: "Debes iniciar sesión",
        duration: 2000,
      });
      return;
    }

    // 1) Actualizamos el chat en frontend
    const newMsg: Message = {
      id: Date.now().toString(),
      text: contenido,
      user: { nombre: "Yo" },
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, newMsg]);
    setText("");

    // 2) Enviamos al backend para sumar 1 punto por mensaje
    //    Aquí asumimos que chatId representa una sesión de streaming (id_sesion).
    //    Si no es así, igual podrías usar otra ruta dedicada a puntos.
    try {
      const resp = await fetch(
        `${BACKEND_URL}/sesiones/${chatId}/mensajes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_espectador: usuario.id_usuario,
            contenido,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error("Error registrando mensaje en backend:", err);
      } else {
        toast?.({
          title: "Ganaste 1 punto por mensaje",
          duration: 1200,
        });

        // refrescamos puntos desde backend
        try {
          const data = await resp.json();
          // si el backend devuelve progreso, podrías usarlo aquí;
          // por ahora recargamos con la misma función
        } catch {
          // ignoramos y recargamos completo
        }
        // recargar progreso completo
        const respProg = await fetch(
          `${BACKEND_URL}/usuarios/${usuario.id_usuario}/progreso`
        );
        if (respProg.ok) {
          const data: any[] = await respProg.json();
          if (chat?.id) {
            const prog = data.find((p) => p.id_streamer === chat.id);
            setUserPoints(prog?.puntos_actuales ?? 0);
          } else {
            const total = data.reduce(
              (acc, p) => acc + (p.puntos_actuales ?? 0),
              0
            );
            setUserPoints(total);
          }
        }
      }
    } catch (e) {
      console.error("Error al conectar con backend de mensajes:", e);
    }
  };

  // ============================
  //  Resultado de ruleta
  // ============================
  const handleRouletteResult = () => {
    const usuario = getCurrentUser();
    if (!usuario) {
      toast?.({ title: "Inicia sesión para jugar", duration: 2000 });
      return;
    }

    fetch(`${BACKEND_URL}/ruleta/jugar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_espectador: usuario.id_usuario,
        puntos_apostados: ROULETTE_COST,
        id_streamer: chat?.id || null,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data.error ||
              "Error al procesar la ruleta (¿tienes suficientes puntos?)"
          );
        }

        // data: { monedas_ganadas, saldo_monedas_nuevo, puntos_actuales, resultado_segmento, ... }

        // Actualizar puntos con lo que responde el backend
        if (typeof data.puntos_actuales === "number") {
          setUserPoints(data.puntos_actuales);
        } else {
          // fallback: recargar progreso completo
          const respProg = await fetch(
            `${BACKEND_URL}/usuarios/${usuario.id_usuario}/progreso`
          );
          if (respProg.ok) {
            const progresos: any[] = await respProg.json();
            if (chat?.id) {
              const prog = progresos.find(
                (p) => p.id_streamer === chat.id
              );
              setUserPoints(prog?.puntos_actuales ?? 0);
            } else {
              const total = progresos.reduce(
                (acc, p) => acc + (p.puntos_actuales ?? 0),
                0
              );
              setUserPoints(total);
            }
          }
        }

        // Actualizar saldo global (monedas)
        refrescarSaldo();

        // Overlay animado
        window.dispatchEvent(
          new CustomEvent("tistos:overlay", {
            detail: {
              type: "gift",
              from: usuario.nombre ?? usuario.email ?? "Anon",
              giftName: `Ruleta (+${data.monedas_ganadas} monedas)`,
              points: data.monedas_ganadas,
              multiplier: 0,
            },
          })
        );

        toast?.({
          title: `¡Ganaste ${data.monedas_ganadas} monedas!`,
          description: `Resultado: ${data.resultado_segmento}`,
          duration: 2000,
        });
      })
      .catch((error: any) => {
        toast?.({
          title: error.message || "Error al procesar la ruleta",
          duration: 2000,
        });
        console.error(error);
      });
  };

  // ============================
  //  Render
  // ============================
  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <OverlayAnimator />

      {/* Header */}
      <div className="flex items-center gap-2 p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3">
          {chat?.avatar ? (
            <img
              src={chat.avatar}
              alt={chat.nombre}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white">
              U
            </div>
          )}
          <div>
            <div className="font-semibold">
              {chat?.nombre ?? `Chat ${chatId}`}
            </div>
            <div className="text-xs text-muted-foreground">
              Nivel {chat?.level ?? "-"}
            </div>
          </div>
        </div>

        {/* Saldo y puntos desde backend */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div style={{ color: "#fff", fontWeight: 700 }}>
            {saldo ?? 0} 💰
          </div>
          <div style={{ color: "#cfc" }}>{userPoints ?? 0} pts</div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 px-4 overflow-y-auto">
        <div className="mt-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.user.nombre === "Yo" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] px-3 py-2 rounded-lg ${
                  m.user.nombre === "Yo"
                    ? "bg-primary text-white"
                    : "bg-card text-white"
                }`}
              >
                <div className="text-sm">{m.text}</div>
                <div className="text-[10px] text-muted-foreground mt-1 text-right">
                  {new Date(m.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Botón Ruleta */}
      <div className="fixed bottom-20 left-4 right-4 bg-transparent">
        <button
          onClick={() => {
            if (!currentUser) {
              toast?.({ title: "Inicia sesión para jugar", duration: 2000 });
              return;
            }
            if (userPoints < ROULETTE_COST) {
              toast?.({
                title: `Necesitas ${ROULETTE_COST} pts para jugar`,
                duration: 2200,
              });
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
            cursor: "pointer",
          }}
          title={`Jugar ruleta (${ROULETTE_COST} pts)`}
        >
          🎯 Ruleta ({ROULETTE_COST} pts)
        </button>
      </div>

      {/* Input de mensaje */}
      <div className="fixed bottom-4 left-4 right-4 bg-transparent">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flex: 1,
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 rounded-2xl px-4 py-2 bg-card text-white outline-none"
              placeholder="Escribe un mensaje..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <Button onClick={handleSend} size="sm" variant="secondary">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de ruleta */}
      <RouletteModal
        open={rouletteOpen}
        costPoints={ROULETTE_COST}
        userPoints={userPoints}
        onClose={() => setRouletteOpen(false)}
        onResult={() => {
          setRouletteOpen(false);
          handleRouletteResult();
        }}
      />
    </div>
  );
};

export default ChatView;
