import { z } from "zod";

import type { components } from "@/api/esquema";

import {
  esquemaLineaCotizada,
  leerDescuento,
  MONEDAS,
  TIPOS_DESCUENTO,
} from "@/features/comercial/schemas/material";
import { TEXTOS_COMERCIAL } from "@/features/comercial/textos";
import { leerManoDeObra } from "@/features/instalaciones/schemas/instalacion";
import { compararDecimales, decimalAEdicion } from "@/lib/decimal";

import { TEXTOS_COTIZACIONES } from "../textos";

const V = { ...TEXTOS_COMERCIAL.validacion, ...TEXTOS_COTIZACIONES.validacion };
export const TIPOS_COTIZACION = ["INSTALACION", "VENTA"] as const;
export const VALIDECES = ["8", "15", "30"] as const;

/**
 * Cotización (RF-80 a RF-86, guía §17) con los límites de SolicitudCotizacion. La fecha siempre es
 * hoy (P-49). Las de instalación llevan descripción y pueden ser solo de mano de obra; las de venta,
 * al menos un producto.
 */
export const esquemaCotizacion = z
  .object({
    tipo: z.enum(TIPOS_COTIZACION),
    clienteId: z
      .number({ error: V.cliente })
      .nullable()
      .refine((id) => id !== null, V.cliente),
    validezDias: z.enum(VALIDECES),
    moneda: z.enum(MONEDAS),
    lineas: z.array(esquemaLineaCotizada).max(200),
    descripcion: z.string().trim().max(2000, V.largo(2000)),
    manoDeObra: z.string(),
    descuentoTipo: z.enum(TIPOS_DESCUENTO),
    descuentoValor: z.string(),
    monedasComprobante: z.array(z.enum(MONEDAS)),
    observaciones: z.string().trim().max(500, V.largo(500)),
  })
  .transform((c, ctx) => {
    const instalacion = c.tipo === "INSTALACION";
    if (instalacion && c.descripcion === "") {
      ctx.addIssue({ code: "custom", message: V.descripcion, path: ["descripcion"] });
      return z.NEVER;
    }
    const manoDeObra = instalacion ? leerManoDeObra(c.manoDeObra) : "0";
    if (typeof manoDeObra !== "string") {
      ctx.addIssue({ code: "custom", message: manoDeObra.error, path: ["manoDeObra"] });
      return z.NEVER;
    }
    if (c.lineas.length === 0 && compararDecimales(manoDeObra, "0") <= 0) {
      ctx.addIssue({
        code: "custom",
        message: instalacion ? V.vacia : V.lineas,
        path: [instalacion ? "manoDeObra" : "lineas"],
      });
      return z.NEVER;
    }
    const descuento = leerDescuento(c.descuentoTipo, c.descuentoValor);
    if ("error" in descuento) {
      ctx.addIssue({ code: "custom", message: descuento.error, path: ["descuentoValor"] });
      return z.NEVER;
    }
    return {
      tipo: c.tipo,
      clienteId: c.clienteId,
      validezDias: Number(c.validezDias),
      moneda: c.moneda,
      lineas: c.lineas,
      ...(instalacion ? { descripcion: c.descripcion, manoDeObra } : {}),
      ...descuento,
      monedasComprobante: c.monedasComprobante.filter((m) => m !== c.moneda),
      ...(c.observaciones ? { observaciones: c.observaciones } : {}),
    };
  });

export type EntradaCotizacion = z.input<typeof esquemaCotizacion>;
export type DatosCotizacion = z.output<typeof esquemaCotizacion>;

export const COTIZACION_VACIA: Omit<EntradaCotizacion, "validezDias"> = {
  tipo: "INSTALACION",
  clienteId: null,
  moneda: "USD",
  lineas: [],
  descripcion: "",
  manoDeObra: "",
  descuentoTipo: "NINGUNO",
  descuentoValor: "",
  monedasComprobante: [],
  observaciones: "",
};

/** Validez por defecto: la de Configuración si es una de las permitidas (RF-83). */
export function validezDe(dias: number | undefined): EntradaCotizacion["validezDias"] {
  const texto = String(dias ?? 15);
  return (VALIDECES as readonly string[]).includes(texto)
    ? (texto as EntradaCotizacion["validezDias"])
    : "15";
}

const CLAVE_MONEDA = { USD: "usd", COP: "cop", VES: "ves" } as const;

/**
 * Valores del formulario a partir de una cotización guardada (editar). Los precios quedan escritos
 * tal como se cotizaron. La unidad no dice si admite decimales: lo valida el backend al guardar.
 */
export function entradaDeCotizacion(c: components["schemas"]["CotizacionVista"]): EntradaCotizacion {
  const moneda = c.moneda ?? "USD";
  const manoDeObra = c.resumen?.manoDeObra?.[CLAVE_MONEDA[moneda]]?.monto;
  const descuentoTipo =
    c.descuentoTipo === "PORCENTAJE" || c.descuentoTipo === "VALOR" ? c.descuentoTipo : "NINGUNO";
  return {
    tipo: c.tipo === "VENTA" ? "VENTA" : "INSTALACION",
    clienteId: c.cliente?.id ?? null,
    validezDias: (VALIDECES as readonly string[]).includes(String(c.validezDias))
      ? (String(c.validezDias) as (typeof VALIDECES)[number])
      : "15",
    moneda,
    lineas: (c.lineas ?? []).flatMap((l) =>
      l.productoId === undefined
        ? []
        : [
            {
              productoId: l.productoId,
              nombre: l.descripcion ?? "",
              codigo: l.codigo ?? "",
              abreviatura: l.unidad ?? "",
              admiteDecimales: true,
              controlaSerial: false,
              cantidad: decimalAEdicion(l.cantidad),
              precio: decimalAEdicion(l.precioUnitario?.monto),
              seriales: [],
            },
          ],
    ),
    descripcion: c.descripcion ?? "",
    manoDeObra: manoDeObra && compararDecimales(manoDeObra, "0") > 0 ? decimalAEdicion(manoDeObra) : "",
    descuentoTipo,
    descuentoValor: descuentoTipo === "NINGUNO" ? "" : decimalAEdicion(c.descuentoValor),
    monedasComprobante: (c.monedasComprobante ?? []).filter((m): m is (typeof MONEDAS)[number] =>
      (MONEDAS as readonly string[]).includes(m),
    ),
    observaciones: c.observaciones ?? "",
  };
}
