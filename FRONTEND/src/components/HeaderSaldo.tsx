// src/components/HeaderSaldo.tsx
import React from "react";
import { Coins } from "lucide-react";
import { useSaldo } from "../contexts/SaldoContext";

const HeaderSaldo: React.FC = () => {
  const { saldo } = useSaldo();

  return (
    <div className="fixed top-4 left-4 z-40">
      <div className="inline-flex items-center gap-2 rounded-full bg-black/70 border border-yellow-400/80 px-3 py-1.5 shadow-lg backdrop-blur">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-black">
          <Coins className="w-4 h-4" />
        </div>
        <div className="leading-tight">
          <div className="text-[10px] uppercase tracking-wide text-yellow-200/80">
            Saldo
          </div>
          <div className="text-sm font-semibold text-yellow-50">
            {saldo} monedas
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderSaldo;
