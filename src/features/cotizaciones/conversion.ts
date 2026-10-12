import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import type { EntradaLineaMaterial, TipoDescuento } from "@/features/comercial/schemas/material";
import { decimalAEdicion } from "@/lib/decimal";

export type Conversion = components["schemas"]["ConversionCotizacionVista"];

/** `?cotizacionId=` de la URL, o null. */
export function leerCotizacionId(parametros: URLSearchParams): number | null {
  const id = Number(parametros.get("cotizacionId") ?? "");
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Datos para abrir la venta o la instalación desde una cotización aprobada (RF-93, guía §17). */
export function useConversion(cotizacionId: number | null) {
  return $api.useQuery(
    "get",
    "/api/v1/cotizaciones/{id}/conversion",
    { params: { path: { id: cotizacionId ?? 0 } } },
    { enabled: cotizacionId !== null, retry: false },
  );
}

/**
 * Líneas del formulario con lo cotizado: el precio queda escrito tal como se cotizó y los productos
 * con serial empiezan sin seriales (se eligen ahora). La unidad no dice si admite decimales: lo
 * valida el backend.
 */
export function lineasDeConversion(conversion: Conversion): EntradaLineaMaterial[] {
  return (conversion.lineas ?? []).flatMap((l) =>
    l.productoId === undefined
      ? []
      : [
          {
            productoId: l.productoId,
            nombre: l.nombre ?? "",
            codigo: l.codigo ?? "",
            abreviatura: l.abreviatura ?? "",
            admiteDecimales: !l.controlaSerial,
            controlaSerial: l.controlaSerial ?? false,
            cantidad: l.controlaSerial ? "" : decimalAEdicion(l.cantidad),
            precio: decimalAEdicion(l.precioUnitario),
            seriales: [],
          },
        ],
  );
}

/** Lo común del cobro de la cotización: moneda, descuento, monedas del comprobante y observaciones. */
export function cobroDeConversion(conversion: Conversion) {
  const descuentoTipo: TipoDescuento = conversion.descuentoTipo ?? "NINGUNO";
  return {
    clienteId: conversion.clienteId ?? null,
    moneda: conversion.moneda ?? "USD",
    lineas: lineasDeConversion(conversion),
    descuentoTipo,
    descuentoValor: descuentoTipo === "NINGUNO" ? "" : decimalAEdicion(conversion.descuentoValor),
    monedasComprobante: conversion.monedasComprobante ?? [],
    observaciones: conversion.observaciones ?? "",
  };
}

/** "Cotizado: 4 und" para la línea de un producto. */
export function cantidadCotizada(conversion: Conversion | undefined, productoId: number): string | undefined {
  const linea = conversion?.lineas?.find((l) => l.productoId === productoId);
  return linea?.cantidad ? `${linea.cantidad} ${linea.abreviatura ?? ""}`.trim() : undefined;
}
