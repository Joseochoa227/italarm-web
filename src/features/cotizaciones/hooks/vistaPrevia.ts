import { keepPreviousData } from "@tanstack/react-query";

import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { leerDescuento, lineasCotizadas } from "@/features/comercial/schemas/material";
import { ESPERA_VISTA_PREVIA } from "@/features/compras/hooks/vistaPrevia";
import { leerManoDeObra } from "@/features/instalaciones/schemas/instalacion";
import { useValorDiferido } from "@/lib/diferido";

import type { EntradaCotizacion } from "../schemas/cotizacion";

type Solicitud = components["schemas"]["SolicitudCotizacion"];

/**
 * Vista previa de la cotización (RF-81, RF-85, guía §17): precios, costos a la tasa de hoy y a la
 * de compra (CP-09), resumen, vencimiento y avisos, 400 ms después del último cambio. Se pide con
 * el cliente y algo que cotizar; se muestra tal cual (BF-06) y alimenta la vista previa del PDF.
 */
export function useVistaPreviaCotizacion(entrada: EntradaCotizacion) {
  const descuento = leerDescuento(entrada.descuentoTipo, entrada.descuentoValor);
  const instalacion = entrada.tipo === "INSTALACION";
  const manoDeObra = instalacion ? leerManoDeObra(entrada.manoDeObra) : "0";
  const solicitud: Solicitud | null =
    entrada.clienteId === null
      ? null
      : {
          tipo: entrada.tipo,
          clienteId: entrada.clienteId,
          moneda: entrada.moneda,
          validezDias: Number(entrada.validezDias),
          lineas: lineasCotizadas(entrada.lineas),
          // La descripción no cambia el cálculo, pero el backend la exige en las de instalación.
          ...(instalacion
            ? {
                descripcion: entrada.descripcion.trim() || "-",
                ...(typeof manoDeObra === "string" ? { manoDeObra } : {}),
              }
            : {}),
          ...("error" in descuento ? {} : descuento),
          version: 0,
        };
  const { valor: cuerpo, pendiente } = useValorDiferido(solicitud, ESPERA_VISTA_PREVIA);
  const hayAlgo =
    cuerpo !== null &&
    ((cuerpo.lineas?.length ?? 0) > 0 ||
      (cuerpo.tipo === "INSTALACION" && Number(cuerpo.manoDeObra ?? "0") > 0));
  const consulta = $api.useQuery(
    "post",
    "/api/v1/cotizaciones/vista-previa",
    { body: cuerpo ?? { tipo: "VENTA", clienteId: 0, moneda: "USD", version: 0 } },
    { enabled: hayAlgo, placeholderData: keepPreviousData, retry: false },
  );
  return { consulta, hayAlgo, pendiente };
}
