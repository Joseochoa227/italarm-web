import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";

export type TasasVigentes = components["schemas"]["TasasVigentesVista"];
export type TasaVigente = components["schemas"]["TasaVigenteVista"];
export type Tasa = components["schemas"]["TasaVista"];
export type Par = NonNullable<Tasa["par"]>;

/** Tasas del día (RF-30): al entrar y cada 5 minutos (guía §7). */
export function useTasasVigentes() {
  return $api.useQuery("get", "/api/v1/tasas/vigentes", undefined, {
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });
}

/** Después de registrar o corregir: recuadro, avisos e historial se vuelven a pedir. */
export function useRefrescarTasas() {
  const clienteConsultas = useQueryClient();
  return useCallback(async () => {
    await Promise.all([
      clienteConsultas.invalidateQueries({ queryKey: ["get", "/api/v1/tasas/vigentes"] }),
      clienteConsultas.invalidateQueries({ queryKey: ["get", "/api/v1/tasas"] }),
    ]);
  }, [clienteConsultas]);
}
