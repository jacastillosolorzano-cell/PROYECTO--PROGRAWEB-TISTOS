import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Music2, X, RotateCcw, Timer, Layout, Mic, ChevronDown } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:3000"); // Cambia al URL de tu backend

const Create = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("foto");
  const [streamId, setStreamId] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});

  useEffect(() => {
    // Conexión Socket
    socket.on("connect", () => console.log("Socket conectado:", socket.id));

    socket.on("stream-offer", async (data) => {
      const pc = createPeerConnection(data.from);
      await pc.setRemoteDescription(data.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("stream-answer", { streamId: data.streamId, answer, to: data.from });
    });

    socket.on("stream-answer", async (data) => {
      const pc = peersRef.current[data.from];
      if (pc) await pc.setRemoteDescription(data.answer);
    });

    socket.on("ice-candidate", (data) => {
      const pc = peersRef.current[data.from];
      if (pc) pc.addIceCandidate(data.candidate);
    });
  }, []);

  const startStream = async () => {
    const id = crypto.randomUUID();
    setStreamId(id);
    setIsStreaming(true);

    // Unirse a la sala como streamer
    socket.emit("join_stream", { streamId: id, role: "streamer" });

    // Obtener video/audio local
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    // Guardar local tracks en PeerConnection cuando un viewer se conecte
    socket.on("viewer-joined", async (viewerId: string) => {
      const pc = createPeerConnection(viewerId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("stream-offer", { streamId: id, offer, to: viewerId, from: socket.id });
    });
  };

  const createPeerConnection = (peerId: string) => {
    const pc = new RTCPeerConnection();
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { streamId, candidate: event.candidate, to: peerId, from: socket.id });
      }
    };
    pc.ontrack = (event) => {
      // Aquí podrías mostrar el video de otro viewer si quieres
    };
    peersRef.current[peerId] = pc;
    return pc;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Encabezado */}
      <div className="flex items-center gap-2 p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <X className="w-6 h-6" />
        </Button>
        <div className="flex-1 flex items-center bg-card rounded px-2">
          <Music2 className="w-5 h-5 text-muted-foreground mr-2" />
          <span className="text-muted-foreground">Agregar sonido...</span>
        </div>
      </div>

      {/* Contenido central */}
      <div className="flex flex-col items-center justify-center flex-1 mt-60 relative">
        {/* Botones flotantes */}
        <div className="flex flex-col items-end gap-4 absolute right-8 top-32">
          <Button variant="ghost" size="icon"><RotateCcw className="w-6 h-6" /></Button>
          <Button variant="ghost" size="icon"><X className="w-6 h-6" /></Button>
          <Button variant="ghost" size="icon"><Timer className="w-6 h-6" /></Button>
          <Button variant="ghost" size="icon"><Layout className="w-6 h-6" /></Button>
          <Button variant="ghost" size="icon"><Mic className="w-6 h-6" /></Button>
          <Button variant="ghost" size="icon"><ChevronDown className="w-6 h-6" /></Button>
        </div>

        {/* Selector de modos */}
        <div className="flex items-center gap-4 mt-32">
          <Button variant={mode === "min" ? "secondary" : "outline"} size="sm" onClick={() => setMode("min")}>min</Button>
          <Button variant={mode === "60s" ? "secondary" : "outline"} size="sm" onClick={() => setMode("60s")}>60 s</Button>
          <Button variant={mode === "15s" ? "secondary" : "outline"} size="sm" onClick={() => setMode("15s")}>15 s</Button>
          <Button variant={mode === "foto" ? "secondary" : "outline"} size="sm" onClick={() => setMode("foto")}>FOTO</Button>
          <Button variant={mode === "texto" ? "secondary" : "outline"} size="sm" onClick={() => setMode("texto")}>TEXTO</Button>
        </div>

        {/* Video y botón central */}
        <div className="flex flex-col items-center justify-center mt-6">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-64 h-64 rounded-full border-4 border-white bg-black"
          />
          <div className="w-24 h-24 mt-4">
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
              <span className="text-white text-center mt-2">Stream activo</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-center gap-8 mb-8">
        <span className="text-purple-500 font-bold">AI SELF</span>
        <span className="font-bold text-foreground">PUBLICACIÓN</span>
        <span className="text-muted-foreground">CREAR</span>
      </div>

      <div className="mt-auto">
        <BottomNav />
      </div>
    </div>

  );
};

export default Create;