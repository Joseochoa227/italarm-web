import { useSyncExternalStore } from "react";

/** Corte entre celular y computador del prototipo (BF-08). */
export const CONSULTA_ESCRITORIO = "(min-width: 820px)";

function suscribirMedio(consulta: string) {
  return (avisar: () => void) => {
    const medio = window.matchMedia(consulta);
    medio.addEventListener("change", avisar);
    return () => {
      medio.removeEventListener("change", avisar);
    };
  };
}

const suscribirEscritorio = suscribirMedio(CONSULTA_ESCRITORIO);

/** true en computador: menú lateral; false en celular: barras superior e inferior. */
export function useEsEscritorio(): boolean {
  return useSyncExternalStore(suscribirEscritorio, () => window.matchMedia(CONSULTA_ESCRITORIO).matches);
}

function suscribirConexion(avisar: () => void) {
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
  };
}

/** false cuando el navegador está sin internet (BF-13). */
export function useEnLinea(): boolean {
  return useSyncExternalStore(suscribirConexion, () => navigator.onLine);
}
