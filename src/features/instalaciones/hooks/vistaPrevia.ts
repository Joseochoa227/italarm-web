import { keepPreviousData } from "@tanstack/react-query";

import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { ESPERA_VISTA_PREVIA } from "@/features/compras/hooks/vistaPrevia";
import { leerDescuento, lineasParaVistaPrevia } from "@/features/comercial/schemas/material";
import { useValorDiferido } from "@/lib/diferido";

import { type EntradaInstalacion, leerManoDeObra } from "../schemas/instalacion";

type Solicitud = components["schemas"]["SolicitudInstalacion"];

/**
 * Vista previa de la instalación (guía §15): material, cobro, garantías y `puedeGuardar`, 400 ms
 * después del último cambio. Se pide con el cliente, algún técnico y algo que cobrar; se muestra tal
 * cual (BF-06).
 */
export function useVistaPreviaInstalacion(entrada: EntradaInstalacion, hoy: string) {
  const descuento = leerDescuento(entrada.descuentoTipo, entrada.descuentoValor);
  const manoDeObra = leerManoDeObra(entrada.manoDeObra);
  const lineas = lineasParaVistaPrevia(entrada.lineas);
  const solicitud: Solicitud | null =
    // Sin cliente o sin técnicos el backend rechaza la vista previa (los técnicos no cambian el cobro).
    entrada.clienteId === null || entrada.tecnicos.length === 0
      ? null
      : {
          clienteId: entrada.clienteId,
          moneda: entrada.moneda,
          // La descripción y los técnicos no cambian la vista previa, pero el contrato los pide.
          descripcion: entrada.descripcion || "-",
          tecnicos: entrada.tecnicos,
          ...(entrada.direccion.trim() ? { direccion: entrada.direccion.trim() } : {}),
          ...(entrada.fecha && entrada.fecha <= hoy ? { fecha: entrada.fecha } : {}),
          garantiaManoObraMeses: Number(entrada.garantiaManoObraMeses),
          lineas,
          ...(typeof manoDeObra === "string" ? { manoDeObra } : {}),
          ...("error" in descuento ? {} : descuento),
        };
  const { valor: cuerpo, pendiente } = useValorDiferido(solicitud, ESPERA_VISTA_PREVIA);
  const hayAlgo =
    cuerpo !== null &&
    ((cuerpo.lineas !== undefined && cuerpo.lineas.length > 0) || Number(cuerpo.manoDeObra ?? "0") > 0);
  const consulta = $api.useQuery(
    "post",
    "/api/v1/instalaciones/vista-previa",
    { body: cuerpo ?? { clienteId: 0, moneda: "USD", descripcion: "-", tecnicos: [] } },
    { enabled: hayAlgo, placeholderData: keepPreviousData, retry: false },
  );
  return { consulta, hayAlgo, pendiente };
}
