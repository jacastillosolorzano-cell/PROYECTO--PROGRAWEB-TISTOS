import React from "react";

interface ComprobanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number; // cantidad de monedas recargadas
}

const ComprobanteModal: React.FC<ComprobanteModalProps> = ({
  isOpen,
  onClose,
  amount,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "400px",
          width: "100%",
          color: "black",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "16px",
          }}
        >
          Comprobante de recarga
        </h3>

        <p style={{ fontSize: "14px", marginBottom: "8px" }}>
          <strong>Monedas recargadas:</strong> {amount} monedas
        </p>
        <p style={{ fontSize: "14px", marginBottom: "8px" }}>
          <strong>Fecha:</strong> {new Date().toLocaleString()}
        </p>
        <p style={{ fontSize: "14px", marginBottom: "8px" }}>
          <strong>Estado:</strong> Completado
        </p>
        <p style={{ fontSize: "14px", marginBottom: "16px" }}>
          ¡Pago procesado exitosamente! Tu saldo ha sido actualizado. El detalle
          del monto en soles está disponible en tu historial de transacciones.
        </p>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "8px",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontWeight: 500,
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default ComprobanteModal;
