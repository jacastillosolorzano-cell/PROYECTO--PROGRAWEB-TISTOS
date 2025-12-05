import { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Share2, Music2, Play } from "lucide-react";
import type { Video } from "./VideoFeed";
import MenuRegalos from "@/components/MenuRegalos";
import CommentSection from "@/pages/ventanas/ComentSection";
import { socket } from "@/lib/socket";

interface VideoCardProps {
  video: Video;
  isActive: boolean;
}

// Tipo de mensaje de chat (por ahora sin nivel, el nivel lo maneja el backend)
interface ChatMessage {
  streamId: string;
  userId: string;
  nombre: string;
  text: string;
  timestamp: string;
}

// Tipo para el evento de subida de nivel
interface LevelUpPayload {
  nivel: string;   // nombre del nivel, ej: "Bronce", "Plata", etc.
  orden: number;   // número de nivel, ej: 1,2,3...
}

const VideoCard = ({ video, isActive }: VideoCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(video.likes);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  // 👇 Estado de nivel del espectador y popup de subida de nivel
  const [nivelActual, setNivelActual] = useState<number | null>(null);
  const [nombreNivelActual, setNombreNivelActual] = useState<string | null>(null);
  const [showLevelPopup, setShowLevelPopup] = useState(false);

  // ==============================
  //  AUTOPLAY CUANDO ES ACTIVO
  // ==============================
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current
        .play()
        .catch((err) => console.warn("No se pudo reproducir el video:", err));
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  // ==============================
  //  JOIN AL CHAT DEL STREAM
  // ==============================
  useEffect(() => {
    if (!isActive) return;
    if (!video.sessionId) return; // cuando uses backend, este será el id real del stream

    const rawUsuario = localStorage.getItem("usuario");
    if (!rawUsuario) return;

    try {
      const usuario = JSON.parse(rawUsuario) as {
        id_usuario: string;
        nombre?: string;
      };

      socket.emit("chat:join", {
        streamId: video.sessionId,
        userId: usuario.id_usuario,
        nombre: usuario.nombre ?? "Viewer",
      });

      console.log(
        "👋 Viewer unido al chat del stream",
        video.sessionId,
        "como",
        usuario.nombre
      );
    } catch (e) {
      console.error("Error al parsear usuario:", e);
    }
  }, [isActive, video.sessionId]);

  // ==============================
  //  ESCUCHAR EVENTO level:up (HU: notificación al subir de nivel)
  // ==============================
  useEffect(() => {
    const handleLevelUp = (data: LevelUpPayload) => {
      console.log("🎉 level:up recibido", data);
      setNivelActual(data.orden);
      setNombreNivelActual(data.nivel || null);
      setShowLevelPopup(true);

      // Ocultar popup después de 3 segundos
      const t = setTimeout(() => {
        setShowLevelPopup(false);
      }, 3000);

      return () => clearTimeout(t);
    };

    socket.on("level:up", handleLevelUp);

    return () => {
      socket.off("level:up", handleLevelUp);
    };
  }, []);

  // ==============================
  //  ENVIAR MENSAJE DE CHAT (usa socket)
  // ==============================
  const handleSendChatMessage = (text: string) => {
    if (!text.trim()) return;
    if (!video.sessionId) return;

    const rawUsuario = localStorage.getItem("usuario");
    if (!rawUsuario) {
      alert("Debes iniciar sesión para comentar");
      return;
    }

    try {
      const usuario = JSON.parse(rawUsuario) as {
        id_usuario: string;
        nombre?: string;
      };

      const payload: ChatMessage = {
        streamId: video.sessionId,
        userId: usuario.id_usuario,
        nombre: usuario.nombre ?? "Viewer",
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      socket.emit("chat:message", payload);
      console.log("📤 chat:message enviado", payload);
    } catch (e) {
      console.error("Error al enviar mensaje de chat:", e);
    }
  };

  const toggleLike = () => {
    setIsLiked((prev) => {
      const next = !prev;
      setLikes((prevLikes) =>
        next ? prevLikes + 1 : Math.max(0, prevLikes - 1)
      );
      return next;
    });
  };

  // Inline component: placeholder para progreso del canal
  const ChannelProgressInline = ({ streamerId }: { streamerId?: string }) => {
    if (!streamerId) return null;
    return null;
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <div className="snap-item relative h-screen w-screen bg-black">
      {/* 🔔 Popup de subida de nivel */}
      {showLevelPopup && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-purple-600/90 text-white px-4 py-2 rounded-2xl text-sm shadow-lg">
          🎉 ¡Subiste al{" "}
          {nombreNivelActual
            ? `nivel ${nombreNivelActual}`
            : `nivel ${nivelActual ?? ""}`}
          !
        </div>
      )}

      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="h-screen w-screen object-cover"
          loop
          muted
          playsInline
          poster={`https://picsum.photos/1080/1920?random=${video.id}`}
        >
          <source src={video.videoUrl} type="video/mp4" />
        </video>
        <div className="absolute inset-0 gradient-overlay" />
      </div>

      {/* Play/Pause Overlay (solo efecto visual) */}
      <button
        className="absolute inset-0 flex items-center justify-center z-10 group"
        tabIndex={-1}
        style={{ pointerEvents: "none" }}
      >
        <div className="opacity-0 group-active:opacity-100 transition-opacity duration-200">
          <Play className="w-20 h-20 text-white drop-shadow-2xl" fill="white" />
        </div>
      </button>

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-24 z-30 flex flex-col gap-6">
        {/* Progreso del canal activo (inline) */}
        <div className="mb-2">
          <ChannelProgressInline streamerId={video.streamerId} />
        </div>

        {/* 🎁 Menú de regalos conectado al backend */}
        {video.streamerId && (
          <div className="mb-2">
            <MenuRegalos streamerId={video.streamerId} />
          </div>
        )}

        {/* Profile */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={video.avatar}
              alt={video.username}
              className="w-12 h-12 rounded-full border-2 border-white"
            />
            <button className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
              +
            </button>
          </div>
        </div>

        {/* Like */}
        <button
          onClick={toggleLike}
          className="flex flex-col items-center gap-1"
        >
          <Heart
            className={`w-8 h-8 transition-all ${
              isLiked
                ? "fill-primary text-primary animate-heart-pop"
                : "text-white"
            }`}
          />
          <span className="text-white text-xs font-semibold text-shadow">
            {formatNumber(likes)}
          </span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setIsCommentModalOpen(true)}
          className="flex flex-col items-center gap-1"
        >
          <MessageCircle className="w-8 h-8 text-white" />
          <span className="text-white text-xs font-semibold text-shadow">
            {formatNumber(video.comments)}
          </span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1">
          <Share2 className="w-8 h-8 text-white" />
          <span className="text-white text-xs font-semibold text-shadow">
            {formatNumber(video.shares)}
          </span>
        </button>

        {/* Music Icon */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Music2 className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-24 left-4 right-20 z-20 animate-slide-up">
        <h3 className="text-white font-bold text-lg mb-1 text-shadow flex items-center gap-2">
          @{video.username}
          {/* Si ya tenemos nivel, mostramos una mini chip con el nivel del espectador */}
          {nivelActual && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-700/80 text-[10px] font-semibold">
              Tu nivel:{" "}
              {nombreNivelActual ? nombreNivelActual : `Lvl ${nivelActual}`}
            </span>
          )}
        </h3>
        <p className="text-white text-sm mb-2 text-shadow line-clamp-2">
          {video.caption}
        </p>
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-white" />
          <p className="text-white text-xs text-shadow truncate">
            {video.music}
          </p>
        </div>
      </div>

      {/* Modal comentarios */}
      {isCommentModalOpen && (
        <CommentSection
          // para backend real, lo correcto es usar sessionId
          sessionId={
            video.sessionId ??
            (typeof video.id === "string" ? video.id : String(video.id))
          }
          onClose={() => setIsCommentModalOpen(false)}
          // callback para mandar mensaje por socket
          onSendMessage={handleSendChatMessage}
        />
      )}
    </div>
  );
};

export default VideoCard;
