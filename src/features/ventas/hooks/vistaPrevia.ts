import { keepPreviousData } from "@tanstack/react-query";

import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { ESPERA_VISTA_PREVIA } from "@/features/compras/hooks/vistaPrevia";
import { useValorDiferido } from "@/lib/diferido";

import { type EntradaVenta, leerDescuento, lineaParaEnviar } from "../schemas/venta";

type Solicitud = components["schemas"]["SolicitudVenta"];

/**
 * Vista previa de la venta (RF-98 a RF-101, guía §14): precios, disponibilidad, costos, resumen y
 * `puedeGuardar`, 400 ms después del último cambio. Solo se pide con el cliente elegido y con las
 * líneas completas; se muestra tal cual (BF-06).
 */
export function useVistaPreviaVenta(entrada: EntradaVenta) {
  const descuento = leerDescuento(entrada.descuentoTipo, entrada.descuentoValor);
  const solicitud: Solicitud | null =
    entrada.clienteId === null
      ? null
      : {
          clienteId: entrada.clienteId,
          moneda: entrada.moneda,
          lineas: entrada.lineas.flatMap((l) => {
            const r = lineaParaEnviar(l);
            return "error" in r ? [] : [r];
          }),
          ...("error" in descuento ? {} : descuento),
        };
  const { valor: cuerpo, pendiente } = useValorDiferido(solicitud, ESPERA_VISTA_PREVIA);
  const hayLineas = (cuerpo?.lineas.length ?? 0) > 0;
  const consulta = $api.useQuery(
    "post",
    "/api/v1/ventas/vista-previa",
    { body: cuerpo ?? { clienteId: 0, moneda: "USD", lineas: [] } },
    { enabled: cuerpo !== null && hayLineas, placeholderData: keepPreviousData, retry: false },
  );
  return { consulta, hayLineas: cuerpo !== null && hayLineas, pendiente };
}
