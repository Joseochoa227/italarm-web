import { z } from "zod";

import {
  esquemaLineaMaterial,
  leerDescuento,
  MONEDAS,
  TIPOS_DESCUENTO,
} from "@/features/comercial/schemas/material";
import { TEXTOS_COMERCIAL } from "@/features/comercial/textos";
import { compararDecimales, leerDecimal } from "@/lib/decimal";

import { TEXTOS_INSTALACIONES } from "../textos";

const V = { ...TEXTOS_COMERCIAL.validacion, ...TEXTOS_INSTALACIONES.validacion };
export const MESES_GARANTIA = ["1", "2", "3"] as const;

/** Mano de obra escrita por el usuario (RF-118): 0 o más. Vacía = 0. */
export function leerManoDeObra(texto: string): string | { error: string } {
  if (texto.trim() === "") return "0";
  const r = leerDecimal(texto, { maxDecimales: 4 });
  return r.error === null ? r.valor : { error: r.error };
}

/**
 * Instalación (RF-107 a RF-119) con los límites de SolicitudInstalacion. La fecha puede ser anterior
 * a hoy, nunca futura (P-38); debe tener material o mano de obra (P-41).
 */
export function esquemaInstalacion(hoy: string) {
  return z
    .object({
      clienteId: z
        .number({ error: V.cliente })
        .nullable()
        .refine((id) => id !== null, V.cliente),
      direccion: z.string().trim().max(200, V.largo(200)),
      fecha: z
        .string()
        .min(1, V.fecha)
        .refine((f) => f <= hoy, V.fechaFutura),
      tecnicos: z.array(z.number()).min(1, V.tecnicos).max(10),
      descripcion: z.string().trim().min(1, V.descripcion).max(2000, V.largo(2000)),
      lineas: z.array(esquemaLineaMaterial).max(200),
      moneda: z.enum(MONEDAS),
      manoDeObra: z.string(),
      garantiaManoObraMeses: z.enum(MESES_GARANTIA),
      condicionesGarantia: z.string().trim().max(2000, V.largo(2000)),
      descuentoTipo: z.enum(TIPOS_DESCUENTO),
      descuentoValor: z.string(),
      monedasComprobante: z.array(z.enum(MONEDAS)),
      observaciones: z.string().trim().max(500, V.largo(500)),
    })
    .transform((i, ctx) => {
      const manoDeObra = leerManoDeObra(i.manoDeObra);
      if (typeof manoDeObra !== "string") {
        ctx.addIssue({ code: "custom", message: manoDeObra.error, path: ["manoDeObra"] });
        return z.NEVER;
      }
      if (i.lineas.length === 0 && compararDecimales(manoDeObra, "0") <= 0) {
        ctx.addIssue({ code: "custom", message: V.vacia, path: ["manoDeObra"] });
        return z.NEVER;
      }
      const descuento = leerDescuento(i.descuentoTipo, i.descuentoValor);
      if ("error" in descuento) {
        ctx.addIssue({ code: "custom", message: descuento.error, path: ["descuentoValor"] });
        return z.NEVER;
      }
      return {
        clienteId: i.clienteId,
        ...(i.direccion ? { direccion: i.direccion } : {}),
        fecha: i.fecha,
        tecnicos: i.tecnicos,
        descripcion: i.descripcion,
        lineas: i.lineas,
        moneda: i.moneda,
        manoDeObra,
        garantiaManoObraMeses: Number(i.garantiaManoObraMeses),
        ...(i.condicionesGarantia ? { condicionesGarantia: i.condicionesGarantia } : {}),
        ...descuento,
        monedasComprobante: i.monedasComprobante.filter((m) => m !== i.moneda),
        ...(i.observaciones ? { observaciones: i.observaciones } : {}),
      };
    });
}

export type EntradaInstalacion = z.input<ReturnType<typeof esquemaInstalacion>>;
export type DatosInstalacion = z.output<ReturnType<typeof esquemaInstalacion>>;
