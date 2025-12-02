import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

const Viewer = ({ streamId }: { streamId: string }) => {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pc = useRef<RTCPeerConnection>();

  useEffect(() => {
    const startViewer = async () => {
      pc.current = new RTCPeerConnection();

      // Mostrar stream remoto
      pc.current.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { streamId, candidate: event.candidate });
        }
      };

      // Unirse a la sala como viewer
      socket.emit("join_stream", { streamId, role: "viewer" });

      // Escuchar oferta del streamer
      socket.on("stream-offer", async (data: any) => {
        if (pc.current) {
          await pc.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.current.createAnswer();
          await pc.current.setLocalDescription(answer);
          socket.emit("stream-answer", { streamId, answer });
        }
      });

      socket.on("ice-candidate", async (data: any) => {
        if (pc.current && data.candidate) {
          await pc.current.addIceCandidate(data.candidate);
        }
      });
    };

    startViewer();
  }, [streamId]);

  return <video ref={remoteVideoRef} autoPlay className="w-full h-auto" />;
};

export default Viewer;
