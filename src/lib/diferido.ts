import { useEffect, useState } from "react";

/**
 * Valor que solo cambia después de `espera` ms sin cambios (por ejemplo, el cuerpo de una vista
 * previa). Se compara por su JSON, así un objeto nuevo con el mismo contenido no reinicia la espera.
 * Devuelve el valor diferido y si hay uno más nuevo esperando.
 */
export function useValorDiferido<T>(valor: T, espera: number): { valor: T; pendiente: boolean } {
  const clave = JSON.stringify(valor);
  const [diferida, setDiferida] = useState(clave);
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setDiferida(clave);
    }, espera);
    return () => {
      clearTimeout(temporizador);
    };
  }, [clave, espera]);
  return { valor: JSON.parse(diferida) as T, pendiente: diferida !== clave };
}
