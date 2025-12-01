import React from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  rechargeAmount: number;
  setRechargeAmount: (value: number) => void;
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
  setRechargeAmount,
  cardNumber,
  setCardNumber,
  expiryDate,
  setExpiryDate,
  cvc,
  setCvc,
  isProcessing,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '400px', width: '100%', color: 'black' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Información de Pago Seguro</h3>
        <p style={{ fontSize: '14px', marginBottom: '16px' }}>Ingresa los detalles de tu tarjeta para recargar monedas.</p>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500' }}>Monto a Recargar</label>
            <input
              type="number"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              min="1"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500' }}>Número de Tarjeta</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="1234 5678 9012 3456"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              maxLength={19}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500' }}>Fecha de Expiración</label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="MM/YY"
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                maxLength={5}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500' }}>CVC</label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                maxLength={3}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            style={{ width: '100%', padding: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {isProcessing ? 'Procesando Pago...' : `Pagar ${rechargeAmount} USD`}
          </button>
        </form>
        <button
          onClick={onClose}
          style={{ marginTop: '16px', width: '100%', padding: '8px', backgroundColor: '#d1d5db', color: 'black', border: 'none', borderRadius: '4px' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;