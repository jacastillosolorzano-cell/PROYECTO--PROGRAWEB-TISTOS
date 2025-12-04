// Ruta: src/components/CommentSection.tsx

import { X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { BACKEND_URL } from "@/config";

interface Message {
  id: number;
  text: string;
  user: string;
  likes: number;
  createdAt: number; // timestamp
}

interface BackendUser {
  id_usuario: string;
  nombre?: string;
  email?: string;
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

const CommentSection = ({
  onClose,
  sessionId,
}: {
  onClose: () => void;
  sessionId?: string;
}) => {
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [mensajes, setMensajes] = useState<Message[]>([
    {
      id: 1,
      text: "¡Qué buen video!",
      user: "user_ana-nivel 8⭐",
      likes: 3,
      createdAt: Date.now() - 1000 * 60 * 5,
    },
    {
      id: 2,
      text: "La edición está top 🔥",
      user: "creador123-nivel 10⭐",
      likes: 5,
      createdAt: Date.now() - 1000 * 60 * 60,
    },
  ]);

  const CHAR_LIMIT = 220;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const currentUser = getCurrentUser();

  const storageKey = `comments_demo_${sessionId || "global"}`;

  // Cargar comentarios guardados para esta sesión
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setMensajes(JSON.parse(stored));
      }
    } catch {
      // ignorar errores de localStorage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Guardar comentarios en localStorage al cambiar
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(mensajes));
    } catch {
      // ignorar errores de localStorage
    }
  }, [mensajes, storageKey]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [mensajes]);

  const displayName =
    currentUser?.nombre ||
    currentUser?.email ||
    "ulima123 - nivel 5 ⭐";

  const handleEnviarMensaje = async () => {
    if (nuevoMensaje.trim() === "" || nuevoMensaje.length > CHAR_LIMIT) return;

    const contenido = nuevoMensaje.trim();
    const now = Date.now();

    const mensajeNuevo: Message = {
      id: now,
      text: contenido,
      user: displayName,
      likes: 0,
      createdAt: now,
    };

    // 1) Añadir mensaje localmente
    setMensajes((prev) => {
      const next = [...prev, mensajeNuevo];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    // 2) Limpiar input
    setNuevoMensaje("");

    // 3) Enviar al backend sólo si tenemos sesión y usuario logueado
    if (!sessionId || !currentUser?.id_usuario) {
      return;
    }

    try {
      const res = await fetch(
        `${BACKEND_URL}/sesiones/${sessionId}/mensajes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_espectador: currentUser.id_usuario,
            contenido,
          }),
        }
      );

      if (!res.ok) {
        console.warn(
          "Error al enviar mensaje al backend",
          await res.text()
        );
        return;
      }

      // Si tu backend devuelve algo útil (p.ej. puntos_actuales),
      // podrías leerlo aquí:
      // const data = await res.json();
      // console.log("Mensaje registrado en backend:", data);
    } catch (e) {
      console.error("Error enviando mensaje:", e);
    }
  };

  const handleLike = (id: number) => {
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
        <header className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">
              A
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
              <div className="text-xs text-muted-foreground">
                Comentando como
              </div>
              <div className="text-sm font-medium">
                {currentUser?.nombre || currentUser?.email || "ulima123"}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </header>

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
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{m.user}</span>
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
                      className="text-muted-foreground"
                    >
                      Responder
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="flex items-center gap-2 border-t p-4 pb-6">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">
            J
          </div>
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Añade un comentario..."
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEnviarMensaje()}
              className="w-full bg-muted border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Añadir comentario"
              maxLength={CHAR_LIMIT}
            />
            <div className="flex justify-between text-xs mt-1 text-muted-foreground">
              <span
                className={`${
                  nuevoMensaje.length > CHAR_LIMIT ? "text-rose-500" : ""
                }`}
              >
                {nuevoMensaje.length}/{CHAR_LIMIT}
              </span>
              <span className="text-muted-foreground">
                Pulsa Enter para enviar
              </span>
            </div>
          </div>
          <Button
            onClick={handleEnviarMensaje}
            className="shrink-0"
            disabled={
              nuevoMensaje.trim() === "" || nuevoMensaje.length > CHAR_LIMIT
            }
          >
            Publicar
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default CommentSection;
