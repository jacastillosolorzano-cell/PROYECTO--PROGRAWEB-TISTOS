// src/components/TotalHours.tsx
import React from "react";

export interface TotalHoursProps {
  hoursDone: number;
  level: number;
}

const TotalHours: React.FC<TotalHoursProps> = ({ hoursDone, level }) => {
  return (
    <div style={{ textAlign: "center", marginBottom: 12 }}>
      <div style={{ color: "#cfc", fontSize: 14 }}>
        Nivel actual:{" "}
        <strong style={{ color: "#fff" }}>
          {level}
        </strong>
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 20,
          fontWeight: 700,
          background: "linear-gradient(90deg,#ff66cc,#7b2cff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Horas totales transmitidas: {hoursDone}
      </div>
    </div>
  );
};

export default TotalHours;
