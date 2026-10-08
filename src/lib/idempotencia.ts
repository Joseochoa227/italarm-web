import { useCallback, useState } from "react";

/**
 * Clave de idempotencia de un documento (RT-07, BF-10, guía §9): se genera al abrir el formulario y
 * se conserva mientras esté abierto, así un doble toque o un reintento no crean dos documentos.
 * Después de guardar, `renovar()` da una clave nueva para el siguiente.
 */
export function useClaveIdempotencia(): { clave: string; renovar: () => void } {
  const [clave, setClave] = useState(() => crypto.randomUUID());
  const renovar = useCallback(() => {
    setClave(crypto.randomUUID());
  }, []);
  return { clave, renovar };
}
