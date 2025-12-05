// src/pages/Create.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Music2, X, Copy } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { BACKEND_URL } from "@/config";

// 👇 Overlay de regalos
import GiftOverlay from "@/pages/ventanas/GiftOverlay";

// 🔌 Usa siempre la misma URL del backend
const socket = io(BACKEND_URL, {
  transports: ["websocket"],
});

// Tipo de mensaje de chat
interface ChatMessage {
  streamId: string;
  userId: string;
  nombre: string;
  text: string;
  timestamp: string;
  nivelOrden?: number;
  nivelNombre?: string;
}

interface GiftInfo {
  nombre: string;
  imagen: string;
}

const Create = () => {
  const navigate = useNavigate();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamId, setStreamId] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 🎁 overlay de regalos
  const [giftOverlay, setGiftOverlay] = useState<GiftInfo | null>(null);
  const [giftVisible, setGiftVisible] = useState(false);

  // Link de compartir
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const streamRef = useRef<MediaStream | null>(null);

  // =============== LISTENERS SOCKET (STREAMER) ===============
  useEffect(() => {
    socket.on("connect", () => console.log("Socket streamer:", socket.id));

    socket.on("stream-answer", async (data) => {
      const pc = peersRef.current[data.from];
      if (pc) {
        console.log("📩 Response del viewer:", data.from);
        await pc.setRemoteDescription(data.answer);
      }
    });

    socket.on("ice-candidate", async (data) => {
      const pc = peersRef.current[data.from];
      if (pc && data.candidate) {
        await pc.addIceCandidate(data.candidate);
      }
    });

    // 💬 Chat en tiempo real
    socket.on("chat:message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    // 🎁 REGALO RECIBIDO EN TIEMPO REAL
    socket.on("gift:received", (data) => {
      console.log("🎁 regalo recibido:", data);

      setGiftOverlay({
        nombre:
          data.multiplicador && data.multiplicador > 1
            ? `${data.regalo} x${data.multiplicador}`
            : data.regalo,
        imagen: data.imagen,
      });

      setGiftVisible(true);
    });

    return () => {
      socket.off("connect");
      socket.off("stream-answer");
      socket.off("ice-candidate");
      socket.off("chat:message");
      socket.off("gift:received");
    };
  }, []);

  // =============================================================
  //                    INICIAR STREAMING
  // =============================================================
  const startStream = async () => {
    const rawUsuario = localStorage.getItem("usuario");
    const token = localStorage.getItem("authToken");

    if (!rawUsuario || !token) {
      alert("Debes iniciar sesión para iniciar un stream");
      return;
    }

    const usuario = JSON.parse(rawUsuario) as {
      id_usuario: string;
      nombre?: string;
    };

    try {
      const res = await fetch(`${BACKEND_URL}/streams/crear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: "Mi Stream",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "No se pudo crear el stream");
        return;
      }

      const data = await res.json(); // { streamId, link }

      setStreamId(data.streamId);
      setIsStreaming(true);
      setMessages([]);

      setShareUrl(data.link);
      setShowShareModal(true);

      socket.emit("join_stream", { streamId: data.streamId, role: "streamer" });

      socket.emit("chat:join", {
        streamId: data.streamId,
        userId: usuario.id_usuario,
        nombre: usuario.nombre ?? "Streamer",
      });

      // Obtener cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socket.on("viewer-joined", async (viewerId: string) => {
        console.log("👤 Viewer:", viewerId);

        const pc = createPeerConnection(viewerId, data.streamId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("stream-offer", {
          offer,
          to: viewerId,
          from: socket.id,
          streamId: data.streamId,
        });
      });
    } catch (error) {
      console.error("Error al iniciar stream:", error);
    }
  };

  // =============================================================
  //              CREAR PEER CONNECTION
  // =============================================================
  const createPeerConnection = (peerId: string, currentStreamId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: peerId,
          from: socket.id,
          streamId: currentStreamId,
        });
      }
    };

    peersRef.current[peerId] = pc;
    return pc;
  };

  // =============================================================
  //                    DETENER STREAM
  // =============================================================
  const stopStream = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};

      if (streamId && token) {
        await fetch(`${BACKEND_URL}/streams/${streamId}/finalizar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setIsStreaming(false);
      setStreamId("");
      localStorage.removeItem("sesion_actual");
    } catch (err) {
      console.error(err);
    }
  };

  // =============================================================
  //                COPIAR LINK DE SHARE
  // =============================================================
  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copiado al portapapeles ✅");
    } catch (error) {
      console.error("Error al copiar link:", error);
      alert("No se pudo copiar, copia el enlace manualmente.");
    }
  };

  // =============================================================
  // UI
  // =============================================================
  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* 🎁 Overlay de regalos */}
      <GiftOverlay
        gift={giftOverlay}
        visible={giftVisible}
        onClose={() => setGiftVisible(false)}
      />

      {/* Header */}
      <div className="flex items-center gap-2 p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <X className="w-6 h-6" />
        </Button>

        <div className="flex-1 flex items-center bg-card rounded px-2">
          <Music2 className="w-5 h-5 text-muted-foreground mr-2" />
          <span className="text-muted-foreground">Agregar sonido...</span>
        </div>
      </div>

      {/* Video */}
      <div className="flex flex-col items-center justify-center flex-1 mt-40 relative">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="w-64 h-64 rounded-full border-4 border-white bg-black"
        />

        <div className="mt-4">
          {!isStreaming ? (
            <Button
              variant="secondary"
              size="icon"
              className="w-20 h-20 rounded-full"
              onClick={startStream}
            >
              Iniciar Stream
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="icon"
              className="w-20 h-20 rounded-full"
              onClick={stopStream}
            >
              Detener
            </Button>
          )}
        </div>

        {/* Chat del streamer */}
        {isStreaming && (
          <div className="absolute right-4 top-4 w-64 max-h-72 bg-black/70 text-white rounded-xl p-2 text-xs flex flex-col">
            <div className="font-semibold mb-1">Chat del stream</div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {messages.length === 0 && (
                <p className="text-[10px] text-gray-300">
                  Aún no hay mensajes...
                </p>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="text-purple-300 font-bold text-[10px]">
                    {m.nivelNombre
                      ? m.nivelNombre
                      : `Lvl ${m.nivelOrden ?? 1}`}
                  </span>
                  <span className="font-semibold text-white">{m.nombre}:</span>
                  <span className="text-gray-200">{m.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* POPUP link */}
      {showShareModal && shareUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-4 mx-4 w-full max-w-md space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Comparte tu stream</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground break-all">{shareUrl}</p>

            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" onClick={() => setShowShareModal(false)}>
                Cerrar
              </Button>
              <Button onClick={handleCopyLink}>
                <Copy className="w-4 h-4 mr-1" />
                Copiar link
              </Button>
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

export default Create;
