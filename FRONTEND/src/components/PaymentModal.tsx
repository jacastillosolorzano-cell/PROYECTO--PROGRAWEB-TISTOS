import React from "react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  rechargeAmount: number;
  rechargePrice: number;
  cardNumber: string;
  setCardNumber: (value: string) => void;
  expiryDate: string;
  setExpiryDate: (value: string) => void;
  cvc: string;
  setCvc: (value: string) => void;
  isProcessing: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  rechargeAmount,
  rechargePrice,
  cardNumber,
  setCardNumber,
  expiryDate,
  setExpiryDate,
  cvc,
  setCvc,
  isProcessing,
}) => {
  if (!isOpen) return null;

  const formattedPrice = rechargePrice.toFixed(2);

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
            marginBottom: "12px",
          }}
        >
          Información de pago seguro
        </h3>

        {rechargeAmount > 0 && (
          <p style={{ fontSize: "14px", marginBottom: "4px" }}>
            Estás recargando <strong>{rechargeAmount}</strong> monedas.
          </p>
        )}

        <p style={{ fontSize: "14px", marginBottom: "16px" }}>
          Monto a pagar: <strong>S/ {formattedPrice}</strong>
        </p>

        <form
          onSubmit={onSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              Número de tarjeta
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="1234 5678 9012 3456"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
              maxLength={19}
            />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                Fecha de expiración
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="MM/AA"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                maxLength={5}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                CVC
              </label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                maxLength={3}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontWeight: 600,
              cursor: isProcessing ? "default" : "pointer",
              opacity: isProcessing ? 0.8 : 1,
            }}
          >
            {isProcessing
              ? "Procesando pago..."
              : `Pagar S/ ${formattedPrice}`}
          </button>
        </form>

        <button
          onClick={onClose}
          type="button"
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "8px",
            backgroundColor: "#d1d5db",
            color: "black",
            border: "none",
            borderRadius: "4px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;
