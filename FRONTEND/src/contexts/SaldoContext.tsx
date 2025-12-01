import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SaldoContextType {
  saldo: number;
  setSaldo: (saldo: number) => void;
}

const SaldoContext = createContext<SaldoContextType | undefined>(undefined);

export const SaldoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [saldo, setSaldo] = useState(50); 

  return (
    <SaldoContext.Provider value={{ saldo, setSaldo }}>
      {children}
    </SaldoContext.Provider>
  );
};

export const useSaldo = () => {
  const context = useContext(SaldoContext);
  if (!context) {
    throw new Error('useSaldo must be used within a SaldoProvider');
  }
  return context;
};