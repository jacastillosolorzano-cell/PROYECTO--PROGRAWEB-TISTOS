import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coins } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ComprobanteModal from "../components/ComprobanteModal";
import PaymentModal from "../components/PaymentModal";
import PackageModal from "../components/PackageModal";
import { useSaldo } from "../contexts/SaldoContext";
import { BACKEND_URL } from "@/config";

interface Transaccion {
  fecha: string;
  descripcion: string;
  monto: string;
  estado: string;
}

const Saldo = () => {
  const navigate = useNavigate();
  const { saldo, refrescarSaldo } = useSaldo();

  const [mensaje, setMensaje] = useState("");
  const [trasccion, settransaccion] = useState<Transaccion[]>([]);

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(0);
  const [rechargePrice, setRechargePrice] = useState(0);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComprobanteOpen, setIsComprobanteOpen] = useState(false);

  // Abrir selector de paquetes
  const handleOpenRechargeModal = () => {
    setIsPackageModalOpen(true);
  };

  // Elegir paquete de monedas
  const handleSelectPackage = (monedas: number, precio: number) => {
    setRechargeAmount(monedas);
    setRechargePrice(precio);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRechargeAmount(0);
    setRechargePrice(0);
    setCardNumber("");
    setExpiryDate("");
    setCvc("");
    setMensaje("");
  };

  const handleClosePackageModal = () => {
    setIsPackageModalOpen(false);
  };

  const handleCloseComprobante = () => {
    setIsComprobanteOpen(false);
  };

  // Enviar pago -> backend /recargas
  const handleSubmitPayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!(rechargeAmount > 0 && cardNumber && expiryDate && cvc)) {
      setMensaje("Por favor, completa todos los campos y un monto mayor a 0");
      return;
    }

    try {
      setIsProcessing(true);
      setMensaje("");

      const rawUsuario = localStorage.getItem("usuario");
      if (!rawUsuario) {
        setMensaje("Debes iniciar sesión para recargar");
        setIsProcessing(false);
        return;
      }

      const resp = await fetch(`${BACKEND_URL}/recargas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
        body: JSON.stringify({
          monedas_compradas: rechargeAmount,
          monto_pagado: rechargePrice,
          moneda: "PEN",
          pasarela: "FAKE-PASARELA",
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al procesar la recarga");
      }

      const data = await resp.json();
      // data.recarga, data.saldo_monedas_nuevo

      // Actualizar saldo global desde backend
      await refrescarSaldo();

      setMensaje(
        `¡Recarga exitosa! Has agregado ${data.recarga.monedas_compradas} monedas.`
      );

      // Agregar nueva transacción al historial
      const nuevaTransaccion: Transaccion = {
        fecha: new Date(data.recarga.fecha_hora).toLocaleString(),
        descripcion: `Recarga de ${data.recarga.monedas_compradas} monedas`,
        monto: `${data.recarga.monto_pagado.toFixed(2)} ${data.recarga.moneda}`,
        estado: data.recarga.estado,
      };
      settransaccion((prev) => [nuevaTransaccion, ...prev]);

      setIsModalOpen(false);
      setTimeout(() => setIsComprobanteOpen(true), 100);
      setTimeout(() => setMensaje(""), 3000);
    } catch (error: any) {
      setMensaje(error.message || "Error al procesar la recarga");
    } finally {
      setIsProcessing(false);
    }
  };

  // Cargar historial real desde GET /recargas/historial
  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const resp = await fetch(`${BACKEND_URL}/recargas/historial`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!resp.ok) {
          console.warn("No se pudo obtener el historial de recargas");
          return;
        }

        const data = await resp.json(); // array de RecargaMonedas

        const mapeadas: Transaccion[] = data.map((r: any) => ({
          fecha: new Date(r.fecha_hora).toLocaleString(),
          descripcion: `Recarga de ${r.monedas_compradas} monedas`,
          monto: `${r.monto_pagado.toFixed(2)} ${r.moneda}`,
          estado: r.estado,
        }));

        settransaccion(mapeadas);
      } catch (error) {
        console.error("Error al cargar historial de recargas:", error);
      }
    };

    cargarHistorial();
  }, []);

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
            Recargar monto
          </Button>
        </div>
        <div className="flex items-center justify-left gap-4">
          <span className="text-muted-foreground">Saldo</span>
          <span className="text-2xl font-bold">{saldo} monedas</span>
        </div>
      </div>

      {mensaje && (
        <div className="max-w-xl mx-auto mb-2 text-center text-primary font-semibold">
          {mensaje}
        </div>
      )}

      {/* Historial de transacciones */}
      <div className="container mx-auto px-4">
        <div className="border-b-2 border-white pb-2 mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-pink-600">
            Historial de Transacciones
          </h1>
        </div>
        <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-300">
          <table
            className="table table-striped"
            border={1}
            style={{
              width: "100%",
              textAlign: "left",
              borderCollapse: "collapse",
            }}
          >
            <thead className="sticky top-0 bg-black text-pink-600 font-semibold">
              <tr>
                <th className="p-2">Fecha</th>
                <th className="p-2">Descripción</th>
                <th className="p-2">Monto</th>
                <th className="p-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {trasccion.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    Aún no se realizan transacciones
                  </td>
                </tr>
              ) : (
                trasccion.map((t, i) => (
                  <tr key={i}>
                    <td>{t.fecha}</td>
                    <td>{t.descripcion}</td>
                    <td
                      style={{ color: "green", fontWeight: "bold" }}
                    >
                      {t.monto}
                    </td>
                    <td>{t.estado}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bloque monetización (placeholder) */}
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

      {/* Modal de Pago */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitPayment}
        rechargeAmount={rechargeAmount}
        rechargePrice={rechargePrice}
        cardNumber={cardNumber}
        setCardNumber={setCardNumber}
        expiryDate={expiryDate}
        setExpiryDate={setExpiryDate}
        cvc={cvc}
        setCvc={setCvc}
        isProcessing={isProcessing}
      />

      {/* Modal de Comprobante */}
      <ComprobanteModal
        isOpen={isComprobanteOpen}
        onClose={handleCloseComprobante}
        amount={rechargeAmount}
      />

      {/* Barra inferior */}
      <div className="mt-auto">
        <BottomNav />
      </div>
    </div>
  );
};

export default Saldo;
