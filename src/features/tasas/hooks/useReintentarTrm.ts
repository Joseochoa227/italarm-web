import { useMutation } from "@tanstack/react-query";

import { api } from "@/api/cliente";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { mensajeDeError } from "@/lib/errores";

import { TEXTOS_TASAS } from "../textos";

import { useRefrescarTasas } from "./consultasTasas";

/** Reintento de la consulta automática de la TRM (guía §7). */
export function useReintentarTrm() {
  const avisar = useAvisar();
  const refrescar = useRefrescarTasas();
  return useMutation({
    mutationFn: async () => (await api.POST("/api/v1/tasas/trm/consultar")).data,
    onSuccess: async (resultado) => {
      await refrescar();
      const clave = resultado?.resultado ?? "FALLO";
      avisar({ titulo: TEXTOS_TASAS.consulta[clave], tono: clave === "FALLO" ? "error" : "exito" });
    },
    onError: (error) => {
      avisar({ titulo: mensajeDeError(error), tono: "error" });
    },
  });
}
