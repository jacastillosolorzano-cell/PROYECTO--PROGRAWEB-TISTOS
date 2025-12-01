import React, { useEffect, useState } from "react";

type OverlayDetail = {
  type?: "gift" | "levelup" | "community";
  from?: string;
  giftName?: string;
  points?: number;
  multiplier?: number;
};

const OverlayAnimator: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<OverlayDetail | null>(null);

  useEffect(() => {
    const onOverlay = (e: Event) => {
      const d = (e as CustomEvent).detail as OverlayDetail;
      setDetail(d);
      setOpen(true);
      setTimeout(() => setOpen(false), 3500);
    };
    window.addEventListener("tistos:overlay", onOverlay as EventListener);
    return () => window.removeEventListener("tistos:overlay", onOverlay as EventListener);
  }, []);

  if (!open || !detail) return null;

  return (
    <div style={{
      position: "fixed",
      left: "50%",
      top: "12%",
      transform: "translateX(-50%)",
      zIndex: 70,
      pointerEvents: "none"
    }}>
      <div style={{
        background: "linear-gradient(90deg,#ff66cc,#7b2cff)",
        padding: "12px 20px",
        borderRadius: 12,
        color: "#111",
        fontWeight: 800,
        boxShadow: "0 10px 40px rgba(123,44,255,0.18)",
        display: "flex",
        gap: 12,
        alignItems: "center",
        minWidth: 260,
        justifyContent: "center"
      }}>
        {detail.type === "gift" && (
          <>
            <div style={{ fontSize: 20 }}>🎁</div>
            <div style={{ color: "#fff" }}>
              <div style={{ fontWeight: 800 }}>{detail.from} envió {detail.giftName}</div>
              <div style={{ fontSize: 13, opacity: 0.95 }}>{detail.points} pts {detail.multiplier ? `· x${detail.multiplier}` : ""}</div>
            </div>
          </>
        )}
        {detail.type === "community" && (
          <div style={{ color: "#fff", fontWeight: 800 }}>¡Meta comunitaria alcanzada! 🎉</div>
        )}
        {detail.type === "levelup" && (
          <div style={{ color: "#fff", fontWeight: 800 }}>¡Subiste de nivel! 🎉 Nivel {detail.points}</div>
        )}
      </div>
    </div>
  );
};

export default OverlayAnimator;