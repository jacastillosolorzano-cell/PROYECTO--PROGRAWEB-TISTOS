import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Music2,
  X,
  RotateCcw,
  Timer,
  Layout,
  Mic,
  ChevronDown
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket"],
});


const Create = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("foto");
  const [streamId, setStreamId] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const streamRef = useRef<MediaStream | null>(null);

  // =============== SOCKET LISTENERS (STREAMER) ===============
  useEffect(() => {
    socket.on("connect", () => console.log("Socket streamer:", socket.id));

    // Viewer envía ANSWER → streamer la recibe aquí
    socket.on("stream-answer", async (data) => {
      const pc = peersRef.current[data.from];
      if (pc) {
        console.log("📩 Recibida ANSWER del viewer:", data.from);
        await pc.setRemoteDescription(data.answer);
      }
    });

    // Viewer envía ICE → streamer lo recibe aquí
    socket.on("ice-candidate", async (data) => {
      const pc = peersRef.current[data.from];
      if (pc && data.candidate) {
        await pc.addIceCandidate(data.candidate);
      }
    });
  }, []);

  // =============================================================
  //                    INICIAR STREAMING
  // =============================================================
  const startStream = async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

    if (!usuario.id_usuario) {
      alert("Debes iniciar sesión");
      return;
    }

    // Crear sesión en el backend
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/streams/crear`, {

      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_streamer: usuario.id_usuario,
        titulo: "Mi Stream",
      }),
    });

    const data = await res.json();
    console.log("STREAM BACKEND:", data);

    const id = data.streamId;
    setStreamId(id);
    setIsStreaming(true);

    // Unirse al room como STREAMER
    socket.emit("join_stream", { streamId: id, role: "streamer" });

    // Obtener cámara/micro
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    streamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    // Esperar viewers
    socket.on("viewer-joined", async (viewerId: string) => {
      console.log("👤 Nuevo viewer:", viewerId);

      if (!streamRef.current) {
        console.error("NO STREAM DISPONIBLE!");
        return;
      }

      const pc = createPeerConnection(viewerId);

      // Agregar pistas del streamer
      streamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, streamRef.current!);
      });

      // Crear OFFER y enviarla al viewer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log("📤 Enviando OFFER a viewer:", viewerId);

      socket.emit("stream-offer", {
        offer,
        to: viewerId,
        from: socket.id,
        streamId: id,
      });
    });

    alert(`🔗 Comparte el enlace: ${data.link}`);
  };


  // =============================================================
  //              Detener Stream
  // =============================================================
  const stopStream = async () => {
    try {
      console.log("⛔ Deteniendo stream...");

      // 1. Apagar camara/microfono
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // 2. Cerrar PeerConnections
      Object.values(peersRef.current).forEach(pc => {
        pc.close();
      });
      peersRef.current = {};

      // 3. Avisar al backend
      if (streamId) {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/streams/${streamId}/finalizar`, {

          method: "POST"
        });
        console.log("✔ Sesión finalizada en backend");
      }

      // 4. UI
      setIsStreaming(false);
      setStreamId("");

      alert("Stream finalizado");

    } catch (err) {
      console.error("Error al detener stream:", err);
    }
  };


  // =============================================================
  //              CREAR PEER CONNECTION (STREAMER)
  // =============================================================
  const createPeerConnection = (peerId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: peerId,
          from: socket.id,
          streamId,
        });
      }
    };

    peersRef.current[peerId] = pc;
    return pc;
  };

  // =============================================================
  //                            UI
  // =============================================================
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

      {/* Video + controles */}
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

      <div className="mt-auto">
        <BottomNav />
      </div>
    </div>
  );
};

export default Create;