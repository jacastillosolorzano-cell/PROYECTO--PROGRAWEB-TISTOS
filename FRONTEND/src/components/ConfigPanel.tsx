import React from "react";

interface ConfigPanelProps {
  hoursPerLevel: number;
  setHoursPerLevel: (value: number) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ hoursPerLevel, setHoursPerLevel }) => {
  const min = 1;
  const max = 999;

  const handleChange = (v: number) => {
    const next = Math.max(min, Math.min(max, Math.floor(v) || min));
    setHoursPerLevel(next);
  };

  // evitar que la rueda del ratón cambie el número al pasar sobre el input
  const preventWheel = (e: React.WheelEvent) => {
    (e.target as HTMLElement).blur();
  };

  return (
    <div
      style={{
        background: "#2a2a2a",
        padding: "14px",
        borderRadius: "12px",
        marginBottom: "18px",
        textAlign: "center",
        boxShadow: "0 0 12px rgba(255, 102, 204, 0.06)",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", color: "#e6e6e6", fontSize: 15 }}>⚙️ Configurar progresión</h3>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        <label style={{ fontSize: 14, color: "#d0d0d0" }}>Horas requeridas por nivel:</label>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "#111",
            padding: "6px 8px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.04)",
            minWidth: 86,
          }}
        >
          <input
            type="number"
            min={min}
            max={max}
            value={hoursPerLevel}
            onChange={(e) => handleChange(Number(e.target.value))}
            onWheel={preventWheel}
            style={{
              padding: "6px 6px",
              borderRadius: 6,
              border: "none",
              background: "transparent",
              color: "#fff",
              width: 48,
              textAlign: "center",
              fontSize: 14,
              outline: "none",
            }}
          />

          {/* botones pequeños verticales al costado */}
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 8 }}>
            <button
              onClick={() => handleChange(hoursPerLevel + 1)}
              title="Incrementar"
              style={{
                width: 22,
                height: 18,
                padding: 0,
                margin: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5l7 7H5l7-7z" />
              </svg>
            </button>

            <button
              onClick={() => handleChange(Math.max(min, hoursPerLevel - 1))}
              title="Decrementar"
              style={{
                width: 22,
                height: 18,
                padding: 0,
                margin: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19l-7-7h14l-7 7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <p style={{ marginTop: 8, fontSize: 12, color: "#9a9a9a" }}>(Cambia este valor para ajustar la progresión)</p>
    </div>
  );
};

export default ConfigPanel;