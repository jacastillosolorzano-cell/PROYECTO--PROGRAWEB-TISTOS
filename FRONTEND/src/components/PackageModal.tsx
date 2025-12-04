import React from "react";
import { Button } from "@/components/ui/button";

interface Package {
  id: number;
  monedas: number;
  precio: number;      // Monto en S/ (PEN)
  descripcion: string;
}

const paquetes: Package[] = [
  { id: 1, monedas: 100, precio: 5, descripcion: "Paquete Básico" },
  { id: 2, monedas: 500, precio: 20, descripcion: "Paquete Estándar" },
  { id: 3, monedas: 1000, precio: 35, descripcion: "Paquete Premium" },
  { id: 4, monedas: 2000, precio: 60, descripcion: "Paquete VIP" },
  { id: 5, monedas: 5000, precio: 120, descripcion: "Paquete Elite" },
  { id: 6, monedas: 10000, precio: 200, descripcion: "Paquete Legendario" },
];

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPackage: (monedas: number, precio: number) => void;
}

const PackageModal: React.FC<PackageModalProps> = ({
  isOpen,
  onClose,
  onSelectPackage,
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
          maxWidth: "600px",
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
          Selecciona un paquete de monedas
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
          {paquetes.map((paquete) => (
            <div
              key={paquete.id}
              style={{
                border: "1px solid #ccc",
                padding: "12px",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>💰</div>
              <h4 style={{ fontSize: "16px", fontWeight: "bold" }}>
                {paquete.descripcion}
              </h4>
              <p style={{ marginTop: 4, marginBottom: 8 }}>
                {paquete.monedas} monedas por{" "}
                <strong>S/ {paquete.precio.toFixed(2)}</strong>
              </p>

              <Button
                onClick={() => {
                  onSelectPackage(paquete.monedas, paquete.precio);
                  onClose();
                }}
                style={{ marginTop: "8px", width: "100%" }}
              >
                Seleccionar
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          onClick={onClose}
          style={{ marginTop: "16px", width: "100%" }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default PackageModal;
