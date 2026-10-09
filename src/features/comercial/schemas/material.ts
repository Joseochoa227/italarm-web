import { z } from "zod";

import { compararDecimales, leerDecimal } from "@/lib/decimal";

import { TEXTOS_COMERCIAL } from "../textos";

const V = TEXTOS_COMERCIAL.validacion;
export const MONEDAS = ["USD", "COP", "VES"] as const;
export type Moneda = (typeof MONEDAS)[number];
export const TIPOS_DESCUENTO = ["NINGUNO", "PORCENTAJE", "VALOR"] as const;
export type TipoDescuento = (typeof TIPOS_DESCUENTO)[number];

/** Línea de material de una venta, instalación o cotización, tal como se edita en el formulario. */
export interface EntradaLineaMaterial {
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
  linea: EntradaLineaMaterial,
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

/** Líneas completas para la vista previa (las incompletas se omiten hasta que se llenen). */
export function lineasParaVistaPrevia(lineas: readonly EntradaLineaMaterial[]) {
  return lineas.flatMap((l) => {
    const r = lineaParaEnviar(l);
    return "error" in r ? [] : [r];
  });
}

/** Descuento sobre todo el documento (P-30, P-40): porcentaje de 0 a 100 o valor; el tope lo valida el backend. */
export function leerDescuento(
  tipo: TipoDescuento,
  texto: string,
): { descuentoTipo?: "PORCENTAJE" | "VALOR"; descuentoValor?: string } | { error: string } {
  if (tipo === "NINGUNO") return {};
  if (texto.trim() === "") return { error: V.descuento };
  const r = leerDecimal(texto, { maxDecimales: tipo === "PORCENTAJE" ? 2 : 4 });
  if (r.error !== null) return { error: r.error };
  if (tipo === "PORCENTAJE" && compararDecimales(r.valor, "100") > 0) return { error: V.porcentaje };
  return { descuentoTipo: tipo, descuentoValor: r.valor };
}

export const esquemaLineaMaterial = z
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

/** Línea nueva al elegir un producto en el selector. */
export function lineaDeProducto(p: {
  id?: number;
  nombre?: string;
  codigo?: string;
  controlaSerial?: boolean;
  unidadMedida?: { abreviatura?: string; admiteDecimales?: boolean };
}): EntradaLineaMaterial | null {
  if (p.id === undefined) return null;
  return {
    productoId: p.id,
    nombre: p.nombre ?? "",
    codigo: p.codigo ?? "",
    abreviatura: p.unidadMedida?.abreviatura ?? "",
    admiteDecimales: p.unidadMedida?.admiteDecimales ?? false,
    controlaSerial: p.controlaSerial ?? false,
    cantidad: p.controlaSerial ? "" : "1",
    precio: "",
    seriales: [],
  };
}
