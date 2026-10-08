import { z } from "zod";

import { compararDecimales, leerDecimal } from "@/lib/decimal";

import { TEXTOS_VENTAS } from "../textos";

const V = TEXTOS_VENTAS.validacion;
export const MONEDAS = ["USD", "COP", "VES"] as const;
export type Moneda = (typeof MONEDAS)[number];
export const TIPOS_DESCUENTO = ["NINGUNO", "PORCENTAJE", "VALOR"] as const;

export interface EntradaLineaVenta {
  productoId: number;
  nombre: string;
  codigo: string;
  abreviatura: string;
  admiteDecimales: boolean;
  controlaSerial: boolean;
  cantidad: string;
  /** Vacío: se usa el precio sugerido (RF-78). */
  precio: string;
  seriales: string[];
}

type Resultado = string | { error: string };

/** Cantidad con los decimales de la unidad (P-09), mayor que 0. */
export function leerCantidad(texto: string, admiteDecimales: boolean): Resultado {
  if (texto.trim() === "") return { error: V.cantidad };
  const r = leerDecimal(texto, { maxDecimales: admiteDecimales ? 2 : 0 });
  if (r.error !== null) return { error: r.error };
  return compararDecimales(r.valor, "0") > 0 ? r.valor : { error: V.mayorQueCero };
}

/** Precio escrito a mano: 0 o más (P-29). Vacío = sugerido (undefined). */
export function leerPrecio(texto: string): Resultado | undefined {
  if (texto.trim() === "") return undefined;
  const r = leerDecimal(texto, { maxDecimales: 4 });
  return r.error === null ? r.valor : { error: r.error };
}

/** Línea para el backend, o el campo que falta. Los productos con serial llevan los seriales (RF-21). */
export function lineaParaEnviar(
  linea: EntradaLineaVenta,
):
  | { productoId: number; cantidad?: string; precioUnitario?: string; seriales?: string[] }
  | { campo: "cantidad" | "precio" | "seriales"; error: string } {
  const precio = leerPrecio(linea.precio);
  if (typeof precio === "object") return { campo: "precio", error: precio.error };
  const conPrecio = precio === undefined ? {} : { precioUnitario: precio };
  if (linea.controlaSerial) {
    return linea.seriales.length === 0
      ? { campo: "seriales", error: V.seriales }
      : { productoId: linea.productoId, seriales: linea.seriales, ...conPrecio };
  }
  const cantidad = leerCantidad(linea.cantidad, linea.admiteDecimales);
  if (typeof cantidad !== "string") return { campo: "cantidad", error: cantidad.error };
  return { productoId: linea.productoId, cantidad, ...conPrecio };
}

/** Descuento sobre toda la venta (P-30): porcentaje de 0 a 100 o valor; el tope lo valida el backend. */
export function leerDescuento(
  tipo: (typeof TIPOS_DESCUENTO)[number],
  texto: string,
): { descuentoTipo?: "PORCENTAJE" | "VALOR"; descuentoValor?: string } | { error: string } {
  if (tipo === "NINGUNO") return {};
  if (texto.trim() === "") return { error: V.descuento };
  const r = leerDecimal(texto, { maxDecimales: tipo === "PORCENTAJE" ? 2 : 4 });
  if (r.error !== null) return { error: r.error };
  if (tipo === "PORCENTAJE" && compararDecimales(r.valor, "100") > 0) return { error: V.porcentaje };
  return { descuentoTipo: tipo, descuentoValor: r.valor };
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
    precio: z.string(),
    seriales: z.array(z.string()),
  })
  .transform((linea, ctx) => {
    const r = lineaParaEnviar(linea);
    if ("error" in r) {
      ctx.addIssue({ code: "custom", message: r.error, path: [r.campo] });
      return z.NEVER;
    }
    return r;
  });

/** Venta (RF-97 a RF-103) con los límites de SolicitudVenta. La fecha siempre es hoy (P-27). */
export const esquemaVenta = z
  .object({
    clienteId: z
      .number({ error: V.cliente })
      .nullable()
      .refine((id) => id !== null, V.cliente),
    moneda: z.enum(MONEDAS),
    lineas: z.array(esquemaLinea).min(1, V.lineas).max(200),
    descuentoTipo: z.enum(TIPOS_DESCUENTO),
    descuentoValor: z.string(),
    monedasComprobante: z.array(z.enum(MONEDAS)),
    observaciones: z.string().trim().max(500, V.largo(500)),
  })
  .transform((venta, ctx) => {
    const descuento = leerDescuento(venta.descuentoTipo, venta.descuentoValor);
    if ("error" in descuento) {
      ctx.addIssue({ code: "custom", message: descuento.error, path: ["descuentoValor"] });
      return z.NEVER;
    }
    return {
      clienteId: venta.clienteId,
      moneda: venta.moneda,
      lineas: venta.lineas,
      ...descuento,
      monedasComprobante: venta.monedasComprobante.filter((m) => m !== venta.moneda),
      ...(venta.observaciones ? { observaciones: venta.observaciones } : {}),
    };
  });

export type EntradaVenta = z.input<typeof esquemaVenta>;
export type DatosVenta = z.output<typeof esquemaVenta>;
