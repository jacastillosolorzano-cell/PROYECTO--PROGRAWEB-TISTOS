// src/pages/Create.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Music2, X, Copy } from "lucide-react"; // 👈 añadimos Copy
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { BACKEND_URL } from "@/config";

// 🔌 Usa siempre la misma URL del backend
const socket = io(BACKEND_URL, {
  transports: ["websocket"],
});

const Create = () => {
  const navigate = useNavigate();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamId, setStreamId] = useState("");

  // 👇 NUEVO: guardar link y controlar popup
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
        console.log("📩 Recibida ANSWER del viewer:", data.from);
        await pc.setRemoteDescription(data.answer);
      }
    });

    socket.on("ice-candidate", async (data) => {
      const pc = peersRef.current[data.from];
      if (pc && data.candidate) {
        await pc.addIceCandidate(data.candidate);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("stream-answer");
      socket.off("ice-candidate");
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

    const usuario = JSON.parse(rawUsuario) as { id_usuario: string; nombre?: string };

    try {
      // Crear sesión en backend (el id_streamer lo saca del token)
      const res = await fetch(`${BACKEND_URL}/streams/crear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: "Mi Stream", // si luego quieres, puedes hacer esto editable
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Error creando stream:", err);
        alert(err.error || "No se pudo crear el stream");
        return;
      }

      const data = await res.json(); // { streamId, link }
      console.log("STREAM BACKEND:", data);

      // Guardar info para regalos y overlay
      localStorage.setItem("id_streamer_actual", usuario.id_usuario);
      localStorage.setItem("sesion_actual", data.streamId);

      setStreamId(data.streamId);
      setIsStreaming(true);

      // 👇 Guardamos el link y abrimos el popup
      setShareUrl(data.link);
      setShowShareModal(true);

      // Unirse al "room" de este stream
      socket.emit("join_stream", { streamId: data.streamId, role: "streamer" });

      // Obtener cámara/micrófono
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Cuando un viewer se conecta, creamos un peer para él
      socket.on("viewer-joined", async (viewerId: string) => {
        console.log("👤 Nuevo viewer:", viewerId);

        const pc = createPeerConnection(viewerId, data.streamId);

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("stream-offer", {
          offer,
          to: viewerId,
          from: socket.id,
          streamId: data.streamId,
        });
      });

      // ❌ YA NO USAMOS alert PARA EL LINK
      // alert(`🔗 Comparte este enlace con tus viewers:\n${data.link}`);
    } catch (error) {
      console.error("Error al iniciar stream:", error);
      alert("Error inesperado al iniciar el stream");
    }
  };

  // 👇 Handler para copiar al portapapeles
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
  //                    DETENER STREAM
  // =============================================================
  const stopStream = async () => {
    try {
      console.log("⛔ Deteniendo stream...");

      const token = localStorage.getItem("authToken");

      // Apagar cámara y micrófono
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // Cerrar todos los peer connections
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};

      // Avisar al backend y registrar minutos / nivel streamer
      if (streamId && token) {
        await fetch(`${BACKEND_URL}/streams/${streamId}/finalizar`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch((e) => console.error("Error al finalizar stream:", e));
      }

      setIsStreaming(false);
      setStreamId("");

      // Limpiar datos de sesión guardados
      localStorage.removeItem("sesion_actual");

      alert("Stream finalizado");
    } catch (err) {
      console.error(err);
    }
  };

  // =============================================================
  //              CREAR PEER CONNECTION (STREAMER)
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
          streamId: currentStreamId, // usamos el id correcto del stream
        });
      }
    };

    peersRef.current[peerId] = pc;
    return pc;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
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

      {/* Video + Botón de iniciar / detener */}
      <div className="flex flex-col items-center justify-center flex-1 mt-40">
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
      </div>

      {/* 👇 POPUP con el link y botón de copiar */}
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

            <p className="text-xs text-muted-foreground break-all">
              {shareUrl}
            </p>

            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="outline"
                onClick={() => setShowShareModal(false)}
              >
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
