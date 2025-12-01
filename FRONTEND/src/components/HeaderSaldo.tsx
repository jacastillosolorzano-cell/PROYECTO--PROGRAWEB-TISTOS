import React from 'react';
import { useSaldo } from '../contexts/SaldoContext';
import { Coins } from 'lucide-react';

const HeaderSaldo: React.FC = () => {
  const { saldo } = useSaldo();

  return (
    <div className="fixed top-4 left-4 z-50 bg-card border-2 border-yellow-400 rounded-xl p-3 shadow-xl flex items-center gap-2">
      <Coins className="w-5 h-5 text-yellow-400" />
      <span className="text-sm font-semibold text-yellow-400">
        Saldo: {saldo} puntos  {/* Cambiado de SOLES a puntos */}
      </span>
    </div>
  );
};

export default HeaderSaldo;
