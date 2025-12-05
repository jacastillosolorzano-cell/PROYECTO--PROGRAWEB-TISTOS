// Ruta: src/pages/ventanas/ComentSection.tsx

import { X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { BACKEND_URL } from "@/config";
import { socket } from "@/lib/socket";

// Si usas NivelChip (opcional, queda bonito):
// import NivelChip from "@/components/NivelChip";

interface BackendUser {
  id_usuario: string;
  nombre?: string;
  email?: string;
}

interface CommentSectionProps {
  onClose: () => void;
  sessionId?: string;              // id_sesion / streamId
  onSendMessage?: (text: string) => void; // viene desde VideoCard
}

interface ChatMessage {
  streamId: string;
  userId: string;
  nombre: string;
  text: string;
  timestamp: string;
  nivelOrden?: number;
  nivelNombre?: string;
}

interface LocalMessage {
  id: string;
  user: string;
  nivelNombre?: string;
  text: string;
  likes: number;
  createdAt: number;
}

const timeAgo = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
};

const getCurrentUser = (): BackendUser | null => {
  try {
    const raw = localStorage.getItem("usuario");
    if (!raw) return null;
    return JSON.parse(raw) as BackendUser;
  } catch {
    return null;
  }
};

const CommentSection = ({ onClose, sessionId, onSendMessage }: CommentSectionProps) => {
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [mensajes, setMensajes] = useState<LocalMessage[]>([]);

  const CHAR_LIMIT = 220;
  const currentUser = getCurrentUser();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const storageKey = `comments_stream_${sessionId || "global"}`;

  // ======================
  // CARGAR COMENTARIOS GUARDADOS
  // ======================
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setMensajes(JSON.parse(stored));
      }
    } catch {}
  }, [sessionId]);

  // GUARDAR AL CAMBIAR
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(mensajes));
    } catch {}
  }, [mensajes, storageKey]);

  // AUTO-FOCUS
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // AUTO-SCROLL
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [mensajes]);

  // ================================
  // 🔥 ESCUCHAR chat:message DEL SOCKET
  // ================================
  useEffect(() => {
    if (!sessionId) return;

    const handler = (msg: ChatMessage) => {
      // Mensajes solo del stream actual
      if (msg.streamId !== sessionId) return;

      console.log("💬 Recibido mensaje REAL:", msg);

      const nuevo: LocalMessage = {
        id: crypto.randomUUID(),
        user: msg.nombre,
        nivelNombre: msg.nivelNombre,
        text: msg.text,
        likes: 0,
        createdAt: Date.now(),
      };

      setMensajes((prev) => [...prev, nuevo]);
    };

    socket.on("chat:message", handler);

    return () => {
      socket.off("chat:message", handler);
    };
  }, [sessionId]);

  // ================================
  // ENVIAR MENSAJE
  // ================================
  const handleEnviarMensaje = async () => {
    const contenido = nuevoMensaje.trim();
    if (!contenido || contenido.length > CHAR_LIMIT) return;

    setNuevoMensaje("");

    // 1) Enviar por socket (viewer → backend → todos)
    if (onSendMessage) {
      onSendMessage(contenido);
    }

    // 2) Opcional: registrar en backend HTTP (ya suma puntos también por socket)
    if (!sessionId || !currentUser?.id_usuario) return;

    try {
      await fetch(`${BACKEND_URL}/sesiones/${sessionId}/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_espectador: currentUser.id_usuario,
          contenido,
        }),
      });
    } catch (e) {
      console.error("Error enviando mensaje al backend:", e);
    }
  };

  const handleLike = (id: string) => {
    setMensajes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, likes: m.likes + 1 } : m))
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-background w-full max-w-2xl h-[75%] rounded-t-2xl grid grid-rows-[auto_1fr_auto] overflow-hidden shadow-xl mb-16"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <header className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">
              💬
            </div>
            <div>
              <h3 className="font-bold">Comentarios</h3>
              <p className="text-xs text-muted-foreground">
                {mensajes.length} comentarios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right mr-2">
              <div className="text-xs text-muted-foreground">Comentando como</div>
              <div className="text-sm font-medium">
                {currentUser?.nombre || currentUser?.email || "Invitado"}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* LISTA DE MENSAJES */}
        <div ref={listRef} className="overflow-y-auto p-4 space-y-3">
          {mensajes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aún no hay comentarios. ¡Sé el primero!
            </p>
          ) : (
            mensajes.map((m) => (
              <div key={m.id} className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-yellow-400 flex items-center justify-center text-white font-bold">
                  {m.user.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{m.user}</span>

                    {/* 👇 Aquí mostramos el nivel del usuario (HU2) */}
                    {m.nivelNombre && (
                      <span className="text-[10px] font-semibold px-2 py-[2px] rounded-full bg-purple-700/80 text-white">
                        {m.nivelNombre}
                      </span>
                      // Si usas NivelChip:
                      // <NivelChip nivelNombre={m.nivelNombre} size="sm" />
                    )}

                    <span className="text-xs text-muted-foreground">
                      · {timeAgo(m.createdAt)}
                    </span>
                  </div>

                  <div className="text-sm mt-1">{m.text}</div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <button
                      onClick={() => handleLike(m.id)}
                      className="flex items-center gap-1 text-rose-500"
                    >
                      <Heart className="w-4 h-4" />
                      <span>{m.likes}</span>
                    </button>
                    <button
                      onClick={() => {
                        setNuevoMensaje(`@${m.user} `);
                        inputRef.current?.focus();
                      }}
                    >
                      Responder
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* INPUT */}
        <footer className="flex items-center gap-2 border-t p-4 pb-6">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Añade un comentario..."
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEnviarMensaje()}
              className="w-full bg-muted border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              maxLength={CHAR_LIMIT}
            />
            <div className="flex justify-between text-xs mt-1 text-muted-foreground">
              <span
                className={
                  nuevoMensaje.length > CHAR_LIMIT ? "text-rose-500" : ""
                }
              >
                {nuevoMensaje.length}/{CHAR_LIMIT}
              </span>
              <span>Pulsa Enter para enviar</span>
            </div>
          </div>
          <Button
            onClick={handleEnviarMensaje}
            disabled={!nuevoMensaje.trim() || nuevoMensaje.length > CHAR_LIMIT}
          >
            Publicar
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default CommentSection;
