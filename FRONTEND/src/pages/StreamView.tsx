import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:5004", { transports: ["websocket"] });




const StreamView = () => {
    const { id_sesion } = useParams();
    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);

    // 👇 NUEVO: estado del audio
    const [audioEnabled, setAudioEnabled] = useState(false);

    useEffect(() => {
        if (!id_sesion) return;

        console.log("Viewer entrando al stream:", id_sesion);

        socket.emit("join_stream", {
            streamId: id_sesion,
            role: "viewer",
        });

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pcRef.current = pc;

        pc.ontrack = (event) => {
            console.log("Track recibido!");
            if (videoRef.current) {
                videoRef.current.srcObject = event.streams[0];
            }
        };

        // Evento cuando el streamer corta el stream
        socket.on("stream-ended", () => {
            console.log("🔴 Stream terminado");

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }

            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }

            alert("El streamer finalizó la transmisión.");
        });

        socket.on("stream-offer", async (data) => {
            if (data.to !== socket.id) return;

            await pc.setRemoteDescription(data.offer);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("stream-answer", {
                answer,
                to: data.from,
                from: socket.id,
                streamId: id_sesion,
            });
        });

        socket.on("ice-candidate", (data) => {
            if (data.to !== socket.id) return;
            pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        });

        return () => {
            socket.off("stream-offer");
            socket.off("ice-candidate");
            socket.off("stream-ended");

            pc.close();
            pcRef.current = null;
        };
    }, [id_sesion]);

    // ============================
    //     TOGGLE DE AUDIO
    // ============================
    const toggleAudio = () => {
        if (!videoRef.current) return;

        const newState = !audioEnabled;
        setAudioEnabled(newState);

        if (newState) {
            // Activar audio
            videoRef.current.muted = false;
            videoRef.current.volume = 1.0;
            videoRef.current.play().catch((err) => console.log(err));
        } else {
            // Silenciar
            videoRef.current.muted = true;
            videoRef.current.volume = 0;
        }
    };

    return (
        <div className="h-screen w-screen bg-black flex items-center justify-center relative">

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={!audioEnabled}   // sincronizado con toggle
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "black",
                }}
            />

            {/* BOTÓN TOGGLE AUDIO */}
            <button
                onClick={toggleAudio}
                className="absolute bottom-10 right-10 bg-white text-black px-4 py-2 rounded-xl shadow-lg"
            >
                {audioEnabled ? "🔇 Silenciar" : "🔊 Activar audio"}
            </button>
        </div>
    );
};

export default React.memo(StreamView);