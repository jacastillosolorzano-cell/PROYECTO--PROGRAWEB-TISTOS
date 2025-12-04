// src/contexts/SaldoContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { BACKEND_URL } from "../config";

interface SaldoContextType {
  saldo: number;
  setSaldo: (saldo: number) => void;
  refrescarSaldo: () => Promise<void>;
}

const SaldoContext = createContext<SaldoContextType | undefined>(undefined);

export const SaldoProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [saldo, setSaldo] = useState<number>(0);

  const refrescarSaldo = async () => {
    try {
      const rawUsuario = localStorage.getItem("usuario");
      if (!rawUsuario) return;

      const usuario = JSON.parse(rawUsuario) as { id_usuario: string };

      const resp = await fetch(
        `${BACKEND_URL}/usuarios/${usuario.id_usuario}/inicializar-perfil`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!resp.ok) {
        console.warn("No se pudo obtener el saldo del backend");
        return;
      }

      const data = await resp.json();
      // Backend devuelve: { message: "Perfil listo", perfil: { saldo_monedas, ... } }
      const nuevoSaldo = data?.perfil?.saldo_monedas ?? 0;
      setSaldo(nuevoSaldo);
    } catch (error) {
      console.error("Error al refrescar saldo:", error);
    }
  };

  useEffect(() => {
    // Al montar la app (y haber hecho login antes), traemos el saldo real
    refrescarSaldo();
  }, []);

  return (
    <SaldoContext.Provider value={{ saldo, setSaldo, refrescarSaldo }}>
      {children}
    </SaldoContext.Provider>
  );
};

export const useSaldo = () => {
  const context = useContext(SaldoContext);
  if (!context) {
    throw new Error("useSaldo must be used within a SaldoProvider");
  }
  return context;
};
