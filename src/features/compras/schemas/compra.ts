import { z } from "zod";

import { compararDecimales, leerDecimal } from "@/lib/decimal";
import { zTexto } from "@/lib/esquemas";
import { ajustarSeriales, normalizarSerial, serialesRepetidos, unidadesDe } from "@/lib/seriales";

import { TEXTOS_COMPRAS } from "../textos";

const V = TEXTOS_COMPRAS.validacion;

/** Datos del producto que la línea necesita para validar y mostrar (no se envían). */
export interface ProductoLinea {
  productoId: number;
  nombre: string;
  codigo: string;
  abreviatura: string;
  admiteDecimales: boolean;
  controlaSerial: boolean;
}

export interface EntradaLinea extends ProductoLinea {
  cantidad: string;
  costoUnitario: string;
  seriales: string[];
}

/** Cantidad con los decimales de la unidad (P-09: Metro hasta 2, Unidad y Par enteros), mayor que 0. */
export function leerCantidad(texto: string, admiteDecimales: boolean): string | { error: string } {
  if (texto.trim() === "") return { error: V.cantidad };
  const r = leerDecimal(texto, { maxDecimales: admiteDecimales ? 2 : 0 });
  if (r.error !== null) return { error: r.error };
  return compararDecimales(r.valor, "0") > 0 ? r.valor : { error: V.mayorQueCero };
}

/** Costo unitario en la moneda de la factura, mayor que 0 (P-21). */
export function leerCosto(texto: string): string | { error: string } {
  if (texto.trim() === "") return { error: V.costo };
  const r = leerDecimal(texto, { maxDecimales: 4 });
  if (r.error !== null) return { error: r.error };
  return compararDecimales(r.valor, "0") > 0 ? r.valor : { error: V.mayorQueCero };
}

/** Línea lista para la vista previa, o null si todavía le falta algo. */
export function lineaParaVistaPrevia(
  linea: EntradaLinea,
): { productoId: number; cantidad: string; costoUnitario: string } | null {
  const cantidad = leerCantidad(linea.cantidad, linea.admiteDecimales);
  const costoUnitario = leerCosto(linea.costoUnitario);
  if (typeof cantidad !== "string" || typeof costoUnitario !== "string") return null;
  return { productoId: linea.productoId, cantidad, costoUnitario };
}

/** Seriales de la línea según la cantidad: uno por unidad, normalizados (P-22). */
export function serialesDeLinea(linea: EntradaLinea, cantidad: string): string[] {
  return ajustarSeriales(linea.seriales, unidadesDe(cantidad)).map(normalizarSerial);
}

/** Un serial por unidad y sin repetir (RF-43, P-22, CP-13). */
export function serialesCompletos(seriales: readonly string[]): boolean {
  return seriales.length > 0 && seriales.every(Boolean) && serialesRepetidos(seriales).size === 0;
}

const esquemaLinea = z
  .object({
    productoId: z.number(),
    nombre: z.string(),
    codigo: z.string(),
    abreviatura: z.string(),
    admiteDecimales: z.boolean(),
    controlaSerial: z.boolean(),
    cantidad: z.string(),
    costoUnitario: z.string(),
    seriales: z.array(z.string()),
  })
  .transform((linea, ctx) => {
    const cantidad = leerCantidad(linea.cantidad, linea.admiteDecimales);
    const costoUnitario = leerCosto(linea.costoUnitario);
    if (typeof cantidad !== "string")
      ctx.addIssue({ code: "custom", message: cantidad.error, path: ["cantidad"] });
    if (typeof costoUnitario !== "string") {
      ctx.addIssue({ code: "custom", message: costoUnitario.error, path: ["costoUnitario"] });
    }
    if (typeof cantidad !== "string" || typeof costoUnitario !== "string") return z.NEVER;
    const seriales = serialesDeLinea(linea, cantidad);
    if (linea.controlaSerial && !serialesCompletos(seriales)) {
      ctx.addIssue({ code: "custom", message: V.seriales, path: ["seriales"] });
      return z.NEVER;
    }
    return {
      productoId: linea.productoId,
      cantidad,
      costoUnitario,
      ...(linea.controlaSerial ? { seriales } : {}),
    };
  });

/** Compra (RF-39 a RF-45) con los límites de SolicitudCompra. La fecha nunca es futura (P-19). */
export function esquemaCompra(hoy: string) {
  return z.object({
    proveedorId: z.string().min(1, V.proveedor).transform(Number),
    numeroFactura: zTexto(V.numeroFactura, 50, V.largo(50)),
    moneda: z.enum(["USD", "COP", "VES"]),
    fecha: z
      .string()
      .min(1, V.fecha)
      .refine((f) => f <= hoy, V.fechaFutura),
    lineas: z.array(esquemaLinea).min(1, V.lineas).max(200),
  });
}

export type EntradaCompra = z.input<ReturnType<typeof esquemaCompra>>;
export type DatosCompra = z.output<ReturnType<typeof esquemaCompra>>;
