import { z } from "zod";

import { leerDecimal } from "./decimal";

/**
 * Piezas de Zod comunes a los formularios. Solo se importan desde las páginas (paquetes diferidos):
 * Zod completo no carga con la app.
 */

/** Campo decimal escrito por el usuario (W-04) → texto decimal de la API. Vacío = error. */
export function zDecimal(opciones: { maxDecimales: number; requerido: string; permitirNegativo?: boolean }) {
  return z.string().transform((texto, ctx) => {
    if (texto.trim() === "") {
      ctx.addIssue({ code: "custom", message: opciones.requerido });
      return z.NEVER;
    }
    const r = leerDecimal(texto, opciones);
    if (r.error !== null) {
      ctx.addIssue({ code: "custom", message: r.error });
      return z.NEVER;
    }
    return r.valor;
  });
}

/** Igual que zDecimal, pero vacío = undefined (campo opcional). */
export function zDecimalOpcional(opciones: { maxDecimales: number }) {
  return z.string().transform((texto, ctx) => {
    if (texto.trim() === "") return undefined;
    const r = leerDecimal(texto, opciones);
    if (r.error !== null) {
      ctx.addIssue({ code: "custom", message: r.error });
      return z.NEVER;
    }
    return r.valor;
  });
}

/** Texto obligatorio, sin espacios a los lados. */
export function zTexto(requerido: string, max: number, mensajeMax: string) {
  return z.string().trim().min(1, requerido).max(max, mensajeMax);
}

/** Texto opcional: vacío = undefined. */
export function zTextoOpcional(max: number, mensajeMax: string) {
  return z
    .string()
    .trim()
    .max(max, mensajeMax)
    .transform((t) => (t === "" ? undefined : t));
}

/** Correo opcional: vacío = undefined. */
export function zCorreoOpcional(mensaje: string) {
  return z
    .string()
    .trim()
    .transform((t) => (t === "" ? undefined : t))
    .pipe(z.email(mensaje).optional());
}
