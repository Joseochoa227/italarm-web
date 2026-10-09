import { z } from "zod";

import {
  type EntradaLineaMaterial,
  esquemaLineaMaterial,
  leerDescuento,
  MONEDAS,
  TIPOS_DESCUENTO,
} from "@/features/comercial/schemas/material";

import { TEXTOS_COMERCIAL } from "@/features/comercial/textos";

const V = TEXTOS_COMERCIAL.validacion;
export type EntradaLineaVenta = EntradaLineaMaterial;

/** Venta (RF-97 a RF-103) con los límites de SolicitudVenta. La fecha siempre es hoy (P-27). */
export const esquemaVenta = z
  .object({
    clienteId: z
      .number({ error: V.cliente })
      .nullable()
      .refine((id) => id !== null, V.cliente),
    moneda: z.enum(MONEDAS),
    lineas: z.array(esquemaLineaMaterial).min(1, V.lineas).max(200),
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
