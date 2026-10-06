import { useMutation, useQueryClient } from "@tanstack/react-query";

import { $api, api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { sinIndefinidos } from "@/lib/objetos";

export type Configuracion = components["schemas"]["ConfiguracionVista"];
type SolicitudConfiguracion = components["schemas"]["SolicitudConfiguracion"];

export const CONSULTA_CONFIGURACION = $api.queryOptions("get", "/api/v1/configuracion");

export function useConfiguracion() {
  return $api.useQuery("get", "/api/v1/configuracion");
}

/** La configuración actual como solicitud completa: el PUT reemplaza todos los campos. */
function aSolicitud(c: Configuracion): SolicitudConfiguracion {
  return {
    empresaNombre: c.empresaNombre ?? "",
    ...(c.empresaLema ? { empresaLema: c.empresaLema } : {}),
    ...(c.empresaNit ? { empresaNit: c.empresaNit } : {}),
    ...(c.empresaCiudad ? { empresaCiudad: c.empresaCiudad } : {}),
    ...(c.empresaTelefono ? { empresaTelefono: c.empresaTelefono } : {}),
    ...(c.empresaCorreo ? { empresaCorreo: c.empresaCorreo } : {}),
    validezCotizacionDias: c.validezCotizacionDias ?? 15,
    garantiaManoObraMeses: c.garantiaManoObraMeses ?? 3,
    garantiaEquiposMeses: c.garantiaEquiposMeses ?? 3,
    limiteVariacionTasa: c.limiteVariacionTasa ?? "5",
    condicionesGarantia: c.condicionesGarantia ?? "",
    piePdf: c.piePdf ?? "",
    version: c.version ?? 0,
  };
}

/** Cambios de una pestaña: todos sus campos, con undefined en los opcionales que quedaron vacíos. */
export type CambiosConfiguracion = {
  [K in keyof SolicitudConfiguracion]?: SolicitudConfiguracion[K] | undefined;
};

/**
 * Guarda una pestaña de la configuración sobre la versión que se tiene (BP-12). Los opcionales que
 * llegan vacíos (undefined) se quitan del cuerpo, y el backend los deja vacíos.
 */
export function useGuardarConfiguracion() {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: async ({ actual, cambios }: { actual: Configuracion; cambios: CambiosConfiguracion }) => {
      const cuerpo = sinIndefinidos({ ...aSolicitud(actual), ...cambios });
      return (await api.PUT("/api/v1/configuracion", { body: cuerpo })).data;
    },
    onSuccess: (nueva) => {
      if (nueva) clienteConsultas.setQueryData(CONSULTA_CONFIGURACION.queryKey, nueva);
    },
  });
}
