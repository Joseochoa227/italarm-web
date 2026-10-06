import { QueryClient } from "@tanstack/react-query";

import { esReintentable } from "@/lib/errores";

/**
 * TanStack Query (BF-03):
 * - las consultas reintentan una vez solo si no hubo respuesta o falló el servidor (los 4xx no);
 * - las mutaciones nunca se reintentan solas: crean documentos (BF-10).
 */
export function crearClienteConsultas(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (intentos, error) => intentos < 1 && esReintentable(error),
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      mutations: { retry: false },
    },
  });
}
