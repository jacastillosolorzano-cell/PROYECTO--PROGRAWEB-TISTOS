import React from "react";

interface LevelUpAlertProps {
  open: boolean;
  level: number;
  onClose: () => void;
}

const LevelUpAlert: React.FC<LevelUpAlertProps> = ({ open, level, onClose }) => {
  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
      <div style={{
        position: "relative",
        background: "rgba(20,20,20,0.98)",
        color: "#fff",
        padding: "32px 36px",
        borderRadius: 16,
        boxShadow: "0 0 40px rgba(204, 102, 255, 0.45)",
        textAlign: "center",
        maxWidth: 420,
        width: "90%",
        border: "1px solid rgba(150,80,200,0.25)"
      }}>
        <h2 style={{ marginBottom: 12, fontSize: 22 }}>🎉 ¡Felicidades! 🎉</h2>
        <p style={{ marginBottom: 18, fontSize: 16 }}>Has subido al <b>nivel {level}</b></p>
        <button
          onClick={onClose}
          style={{
            marginTop: 6,
            background: "linear-gradient(90deg,#ff66cc,#7b2cff)",
            border: "none",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 999,
            cursor: "pointer",
            fontWeight: 700
          }}
        >
          ¡Genial!
        </button>
      </div>
    </div>
  );
};

export default LevelUpAlert;