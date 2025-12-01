import React, { useEffect, useRef, useState } from "react";

type GiftInfo = {
  nombre: string;
  imagen: string;
};

export default function GiftOverlay({
  gift,
  visible,
  onClose,
  durationMs = 3500,
}: {
  gift: GiftInfo | null;
  visible: boolean;
  onClose: () => void;
  durationMs?: number;
}) {
  const [show, setShow] = useState(visible);
  const timeoutRef = useRef<number | null>(null);

  // Start/clear timer when `visible` changes. This ensures the overlay
  // will auto-close after `durationMs` even if the parent keeps `visible` true.
  useEffect(() => {
    setShow(visible);

    // Clear any existing timer first
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!visible) return;

    // Start auto-dismiss timer
    timeoutRef.current = window.setTimeout(() => {
      setShow(false);
      onClose();
      timeoutRef.current = null;
    }, durationMs) as unknown as number;

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [visible, durationMs, onClose]);

  // Clear on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  if (!gift) return null;

  return (
    <div
      className={`fixed right-8 top-20 z-50 pointer-events-auto transform-gpu ${
        show ? "animate-slide-in" : "animate-slide-out"
      }`}
      onClick={() => {
        // manual close clears timer and notifies parent
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setShow(false);
        onClose();
      }}
    >
      <div className="flex items-center gap-4 bg-gradient-to-r from-pink-500 to-secondary p-4 rounded-2xl shadow-glow text-white min-w-[300px] max-w-md">
        <img src={gift.imagen} alt={gift.nombre} className="w-20 h-20 object-contain" />
        <div>
          <div className="font-extrabold text-lg">¡Recibiste un regalo!</div>
          <div className="text-md opacity-95">{gift.nombre}</div>
        </div>
      </div>
    </div>
  );
}
