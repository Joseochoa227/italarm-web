import { z } from "zod";

import { zCorreoOpcional, zTexto, zTextoOpcional } from "@/lib/esquemas";

import { TEXTOS_COMPRAS } from "../textos";

const V = TEXTOS_COMPRAS.validacion;

/** Proveedor (3.6) con los límites de SolicitudProveedor del backend. */
export const esquemaProveedor = z.object({
  nombre: zTexto(V.nombre, 150, V.largo(150)),
  nit: zTextoOpcional(30, V.largo(30)).refine((n) => n === undefined || /^[0-9.\s-]*$/.test(n), V.nit),
  telefono: zTextoOpcional(25, V.largo(25)),
  correo: zCorreoOpcional(V.correo),
  ciudad: zTextoOpcional(80, V.largo(80)),
  monedaHabitual: z.enum(["USD", "COP", "VES"]),
});

export type EntradaProveedor = z.input<typeof esquemaProveedor>;
export type DatosProveedor = z.output<typeof esquemaProveedor>;
