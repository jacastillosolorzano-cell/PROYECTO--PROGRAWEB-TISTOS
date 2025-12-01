import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coins } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import React from 'react';
import ComprobanteModal from '../components/ComprobanteModal';
import PaymentModal from '../components/PaymentModal';
import PackageModal from '../components/PackageModal';
import { useSaldo } from '../contexts/SaldoContext';

const regalosDisponibles = [
  { id: 1, nombre: "Rosa", costo: 10, puntos: 100 },
  { id: 2, nombre: "Diamante", costo: 50, puntos: 500 },
];

const Saldo = () => {
  const navigate = useNavigate();
  const { saldo, setSaldo } = useSaldo();
  const [puntos, setPuntos] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [trasccion, settransaccion] = useState([]);

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(0);
  const [rechargePrice, setRechargePrice] = useState(0); 
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComprobanteOpen, setIsComprobanteOpen] = useState(false);

  const handleOpenRechargeModal = () => {
    setIsPackageModalOpen(true);
  };

  const handleSelectPackage = (monedas: number, precio: number) => {
    setRechargeAmount(monedas);
    setRechargePrice(precio);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRechargeAmount(0);
    setRechargePrice(0); // Resetea precio
    setCardNumber('');
    setExpiryDate('');
    setCvc('');
    setMensaje('');
  };

  const handleClosePackageModal = () => {
    setIsPackageModalOpen(false);
  };

  const handleCloseComprobante = () => {
    setIsComprobanteOpen(false);
  };

  const handleSubmitPayment = (event: React.FormEvent) => {
    event.preventDefault();
    if (rechargeAmount > 0 && cardNumber && expiryDate && cvc) {
      setIsProcessing(true);
      setMensaje('');

      setTimeout(() => {
        setIsProcessing(false);
        setSaldo(saldo + rechargeAmount);
        setMensaje(`¡Recarga exitosa! Has agregado ${rechargeAmount} monedas.`);

        setIsModalOpen(false);

        setTimeout(() => setIsComprobanteOpen(true), 100);

        const nuevaTransaccion = {
          fecha: new Date().toLocaleString(),
          descripcion: `Recarga de ${rechargeAmount} monedas`,
          monto: `${rechargeAmount}.00`,
          estado: "Completado",
        };
        settransaccion([nuevaTransaccion, ...trasccion]);
        setTimeout(() => setMensaje(""), 3000);
      }, 2000);
    } else {
      setMensaje('Por favor, completa todos los campos y un monto mayor a 0');
    }
  };

  const handleEnviarRegalo = (regalo: typeof regalosDisponibles[0]) => {
    if (saldo >= regalo.costo) {
      setSaldo(saldo - regalo.costo);
      setPuntos(puntos + regalo.puntos);
      setMensaje(`¡Has enviado ${regalo.nombre} y apoyado al streamer!`);
      setTimeout(() => setMensaje(""), 2000);
    } else {
      setMensaje("No tienes suficientes monedas.");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col pb-20">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-10"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      <h2 className="text-3xl font-bold text-center pt-8 mb-4">
        Saldo de ulima123
      </h2>

      {/* Saldo de monedas */}
      <div className="max-w-xl mx-auto bg-card rounded-xl p-6 mb-4 shadow flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-400" /> Monedas
          </span>
          <Button variant="link" size="sm" onClick={handleOpenRechargeModal}>
            Recargar Monto
          </Button>
        </div>
        <div className="flex items-center justify-left gap-4">
          <span className="text-muted-foreground">Saldo</span>
          <span className="text-2xl font-bold">{saldo} puntos</span> {/* Cambiado a puntos */}
        </div>
      </div>

      {mensaje && (
        <div className="max-w-xl mx-auto mb-2 text-center text-primary font-semibold">
          {mensaje}
        </div>
      )}

      
      <div className="container mx-auto px-4">
        <div className="border-b-2 border-white pb-2 mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-pink-600">Historial de Transacciones</h1>
        </div>
        <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-300">
          <table className="table table-striped" border={1} style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead className="sticky top-0 bg-black text-pink-600 font-semibold">
              <tr>
                <th className="p-2">Fecha</th>
                <th className="p-2">Descripcion</th>
                <th className="p-2">Monto</th>
                <th className="p-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {trasccion.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    Aun no se realizan transacciones
                  </td>
                </tr>
              ) : (
                trasccion.map((t, i) => (
                  <tr key={i}>
                    <td>{t.fecha}</td>
                    <td>{t.descripcion}</td>
                    <td style={{ color: "green", fontWeight: "bold" }}>{t.monto}</td>
                    <td>{t.estado}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="max-w-xl mx-auto mb-4 mt-4">
        <div className="bg-card rounded-xl p-4 mb-2 flex items-center justify-between">
          <span className="font-bold">Monetización</span>
          <Button variant="link" size="sm">
            Ver más
          </Button>
        </div>
      </div>

      {/* Modal de Paquetes */}
      <PackageModal
        isOpen={isPackageModalOpen}
        onClose={handleClosePackageModal}
        onSelectPackage={handleSelectPackage}
      />

      
      <PaymentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitPayment}
        rechargeAmount={rechargeAmount}
        rechargePrice={rechargePrice} // Nuevo: pasa precio
        cardNumber={cardNumber}
        setCardNumber={setCardNumber}
        expiryDate={expiryDate}
        setExpiryDate={setExpiryDate}
        cvc={cvc}
        setCvc={setCvc}
        isProcessing={isProcessing}
      />

      {/* Modal de Comprobante usando el componente */}
      <ComprobanteModal isOpen={isComprobanteOpen} onClose={handleCloseComprobante} amount={rechargeAmount} />

      {/* Barra inferior */}
      <div className="mt-auto">
        <BottomNav />
      </div>
    </div>
  );
};

export default Saldo;