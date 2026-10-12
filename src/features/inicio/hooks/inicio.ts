import { $api } from "@/api/cliente";

/**
 * Pantalla de Inicio en una petición (RNF-08, guía §18). La comparten la pantalla y el indicador de
 * stock bajo del menú (W-13): al guardar un documento, `invalidateQueries()` la vuelve a pedir.
 */
export function useInicio() {
  return $api.useQuery("get", "/api/v1/inicio");
}

/** Productos bajo el mínimo para el menú (RF-02, F6-06). */
export function useTotalStockBajo(): number {
  const { data } = $api.useQuery("get", "/api/v1/inicio", {}, { select: (d) => d.totalStockBajo ?? 0 });
  return data ?? 0;
}
