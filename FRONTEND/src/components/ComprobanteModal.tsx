import React from 'react';

interface ComprobanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
}

const ComprobanteModal: React.FC<ComprobanteModalProps> = ({ isOpen, onClose, amount }) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '400px', width: '100%', color: 'black' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Comprobante de Pago</h3>
        <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Monto:</strong> {amount} USD</p>
        <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Fecha:</strong> {new Date().toLocaleString()}</p>
        <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Estado:</strong> Completado</p>
        <p style={{ fontSize: '14px', marginBottom: '16px' }}>¡Pago procesado exitosamente! Tu saldo ha sido actualizado.</p>
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default ComprobanteModal;
