import { z } from "zod";

import { compararDecimales, leerDecimal, restarDecimales, sumarDecimales } from "@/lib/decimal";
import { ajustarSeriales, normalizarSerial, serialesRepetidos, unidadesDe } from "@/lib/seriales";

import { TEXTOS_INVENTARIO } from "../textosInventario";

const V = TEXTOS_INVENTARIO.ajuste.validacion;
export const MOTIVOS = ["PERDIDA", "DANO", "CONTEO_FISICO", "GARANTIA", "OTRO"] as const;

export interface ContextoAjuste {
  admiteDecimales: boolean;
  controlaSerial: boolean;
  /** El producto nunca tuvo costo: una entrada lo pide (P-25). */
  sinCosto: boolean;
  stock: string;
}

/** Cantidad positiva con los decimales de la unidad (P-09). */
export function leerCantidadAjuste(texto: string, admiteDecimales: boolean): string | { error: string } {
  if (texto.trim() === "") return { error: V.cantidad };
  const r = leerDecimal(texto, { maxDecimales: admiteDecimales ? 2 : 0 });
  if (r.error !== null) return { error: r.error };
  return compararDecimales(r.valor, "0") > 0 ? r.valor : { error: V.mayorQueCero };
}

/** Costo unitario en USD de una entrada en un producto sin costo (P-25), mayor que 0. */
function leerCostoUsd(texto: string): string | { error: string } {
  if (texto.trim() === "") return { error: V.costo };
  const r = leerDecimal(texto, { maxDecimales: 4 });
  if (r.error !== null) return { error: r.error };
  return compararDecimales(r.valor, "0") > 0 ? r.valor : { error: V.mayorQueCero };
}

/** Cantidad del ajuste: en una salida con serial, la de los seriales elegidos (RF-59). */
export function cantidadDe(entrada: EntradaAjuste, contexto: ContextoAjuste): string | { error: string } {
  if (contexto.controlaSerial && entrada.tipo === "SALIDA") {
    return entrada.seriales.length > 0 ? String(entrada.seriales.length) : { error: V.elegirSeriales };
  }
  return leerCantidadAjuste(entrada.cantidad, contexto.admiteDecimales);
}

/** Vista previa del nuevo stock (RF-58), solo informativa: el oficial lo calcula el backend (BF-06). */
export function nuevoStock(stock: string, tipo: "ENTRADA" | "SALIDA", cantidad: string) {
  const resultado = tipo === "ENTRADA" ? sumarDecimales(stock, cantidad) : restarDecimales(stock, cantidad);
  return { resultado, insuficiente: compararDecimales(resultado, "0") < 0 };
}

export function esquemaAjuste(contexto: ContextoAjuste) {
  return z
    .object({
      tipo: z.enum(["ENTRADA", "SALIDA"]),
      motivo: z.enum(MOTIVOS),
      descripcion: z.string().trim().max(300, V.largo(300)),
      cantidad: z.string(),
      costoUnitarioUsd: z.string(),
      seriales: z.array(z.string()),
    })
    .transform((entrada, ctx) => {
      const { tipo, motivo, descripcion } = entrada;
      if (motivo === "OTRO" && descripcion === "") {
        ctx.addIssue({ code: "custom", message: V.descripcion, path: ["descripcion"] });
      }
      const cantidad = cantidadDe(entrada, contexto);
      if (typeof cantidad !== "string") {
        const campo = contexto.controlaSerial && tipo === "SALIDA" ? "seriales" : "cantidad";
        ctx.addIssue({ code: "custom", message: cantidad.error, path: [campo] });
        return z.NEVER;
      }
      let seriales: string[] | undefined;
      if (contexto.controlaSerial) {
        seriales =
          tipo === "ENTRADA"
            ? ajustarSeriales(entrada.seriales, unidadesDe(cantidad)).map(normalizarSerial)
            : entrada.seriales;
        if (seriales.length === 0 || !seriales.every(Boolean) || serialesRepetidos(seriales).size > 0) {
          ctx.addIssue({ code: "custom", message: V.seriales, path: ["seriales"] });
        }
      }
      let costoUnitarioUsd: string | undefined;
      if (tipo === "ENTRADA" && contexto.sinCosto) {
        const costo = leerCostoUsd(entrada.costoUnitarioUsd);
        if (typeof costo === "string") costoUnitarioUsd = costo;
        else ctx.addIssue({ code: "custom", message: costo.error, path: ["costoUnitarioUsd"] });
      }
      if (ctx.issues.length > 0) return z.NEVER;
      return {
        motivo,
        cantidad: tipo === "SALIDA" ? `-${cantidad}` : cantidad,
        ...(descripcion ? { descripcion } : {}),
        ...(costoUnitarioUsd ? { costoUnitarioUsd } : {}),
        ...(seriales ? { seriales } : {}),
      };
    });
}

export type EntradaAjuste = z.input<ReturnType<typeof esquemaAjuste>>;
export type DatosAjuste = z.output<ReturnType<typeof esquemaAjuste>>;
