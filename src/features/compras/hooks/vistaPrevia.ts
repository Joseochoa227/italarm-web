import { keepPreviousData } from "@tanstack/react-query";

import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { useValorDiferido } from "@/lib/diferido";

import { type EntradaLinea, lineaParaVistaPrevia } from "../schemas/compra";

type Solicitud = components["schemas"]["SolicitudVistaPreviaCompra"];

/** Espera después del último cambio antes de pedir la vista previa (plan, T5). */
export const ESPERA_VISTA_PREVIA = 400;

/**
 * Vista previa de la compra (RF-41, RF-42): se pide con las líneas completas, 400 ms después del
 * último cambio, y se muestra tal cual (BF-06). Mientras llega la nueva, queda la anterior.
 */
export function useVistaPreviaCompra({
  fecha,
  moneda,
  lineas,
  hoy,
}: {
  fecha: string;
  moneda: Solicitud["moneda"];
  lineas: readonly EntradaLinea[];
  hoy: string;
}) {
  const solicitud: Solicitud = {
    moneda,
    // Una fecha futura la rechaza el backend: se pide con la de hoy y el campo muestra su error.
    ...(fecha && fecha <= hoy ? { fecha } : {}),
    lineas: lineas.flatMap((l) => {
      const lista = lineaParaVistaPrevia(l);
      return lista ? [lista] : [];
    }),
  };
  const { valor: cuerpo, pendiente } = useValorDiferido(solicitud, ESPERA_VISTA_PREVIA);
  const consulta = $api.useQuery(
    "post",
    "/api/v1/compras/vista-previa",
    { body: cuerpo },
    { enabled: cuerpo.lineas.length > 0, placeholderData: keepPreviousData, retry: false },
  );
  return { consulta, hayLineas: cuerpo.lineas.length > 0, pendiente };
}
