import { createContext, useContext } from "react";

export interface Aviso {
  titulo: string;
  descripcion?: string;
  tono?: "exito" | "error" | "info";
  accion?: { etiqueta: string; alElegir: () => void };
  /** Milisegundos en pantalla; Infinity lo deja hasta que el usuario lo cierre. */
  duracion?: number;
}

export const ContextoAvisos = createContext<((aviso: Aviso) => void) | null>(null);

/** Notificaciones breves (toasts) para confirmaciones (BF-09). */
export function useAvisar(): (aviso: Aviso) => void {
  const avisar = useContext(ContextoAvisos);
  if (!avisar) throw new Error("useAvisar debe usarse dentro de <ProveedorAvisos>");
  return avisar;
}
