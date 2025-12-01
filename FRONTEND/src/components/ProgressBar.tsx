import React, { useMemo } from "react";

interface ProgressBarProps {
  hoursDone: number;
  hoursRequired: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ hoursDone, hoursRequired }) => {
  const percent = useMemo(() => {
    if (hoursRequired <= 0) return 0;
    return Math.min(100, Math.round((hoursDone / hoursRequired) * 1000) / 10);
  }, [hoursDone, hoursRequired]);

  return (
    <div style={{ background: "#2b2b2b", padding: 14, borderRadius: 10 }}>
      <div style={{ width: "100%", background: "rgba(0,0,0,0.25)", height: 36, borderRadius: 10, overflow: "hidden" }}>
        <div style={{
          width: `${percent}%`,
          height: "100%",
          background: "linear-gradient(90deg,#ff66cc 0%,#b400ff 50%,#7b2cff 100%)",
          transition: "width 700ms ease",
        }} />
      </div>
      <div style={{ textAlign: "center", marginTop: 10, color: "#ddd", fontSize: 14 }}>
        {hoursDone} / {hoursRequired} horas ({percent}%)
      </div>
    </div>
  );
};

export default ProgressBar;