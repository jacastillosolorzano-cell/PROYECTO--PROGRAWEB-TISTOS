// src/components/HeaderSaldo.tsx
import React from "react";
import { Coins } from "lucide-react";
import { useSaldo } from "@/contexts/SaldoContext";

interface HeaderSaldoProps {
  className?: string; // opcional para posicionar desde fuera
}

const HeaderSaldo: React.FC<HeaderSaldoProps> = ({ className = "" }) => {
  const { saldo } = useSaldo();

  return (
    <div
      className={`bg-card border-2 border-yellow-400 rounded-xl px-3 py-2 shadow-xl flex items-center gap-2 ${className}`}
    >
      <Coins className="w-5 h-5 text-yellow-400" />
      <span className="text-sm font-semibold text-yellow-400">
        Saldo: {saldo} monedas
      </span>
    </div>
  );
};

export default HeaderSaldo;
