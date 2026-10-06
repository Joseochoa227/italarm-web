import { z } from "zod";

import { leerDecimal } from "@/lib/decimal";
import { zDecimal, zTexto, zTextoOpcional } from "@/lib/esquemas";

import { TEXTOS_PRODUCTOS } from "../textos";

const V = TEXTOS_PRODUCTOS.validacion;

/**
 * Producto (3.3) con los límites de SolicitudProducto del backend. El stock mínimo admite decimales
 * solo si la unidad los admite (P-09): por eso el esquema recibe las unidades.
 */
export function esquemaProducto(unidadesConDecimales: ReadonlySet<string>) {
  return z
    .object({
      codigo: zTexto(V.codigo, 30, V.largo(30)).regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, V.codigoFormato),
      nombre: zTexto(V.nombre, 150, V.largo(150)),
      marca: zTextoOpcional(80, V.largo(80)),
      modelo: zTextoOpcional(80, V.largo(80)),
      categoriaId: z.string().min(1, V.categoria).transform(Number),
      unidadMedidaId: z.string().min(1, V.unidad).transform(Number),
      controlaSerial: z.boolean(),
      monedaPrecio: z.enum(["USD", "COP", "VES"]),
      precioInstalador: zDecimal({ maxDecimales: 4, requerido: V.precio }),
      precioClienteFinal: zDecimal({ maxDecimales: 4, requerido: V.precio }),
      stockMinimo: z.string(),
      descripcion: zTextoOpcional(2000, V.largo(2000)),
    })
    .transform((datos, ctx) => {
      const { stockMinimo, ...resto } = datos;
      if (stockMinimo.trim() === "") return { ...resto, stockMinimo: undefined };
      const maxDecimales = unidadesConDecimales.has(String(datos.unidadMedidaId)) ? 2 : 0;
      const r = leerDecimal(stockMinimo, { maxDecimales });
      if (r.error !== null) {
        ctx.addIssue({ code: "custom", message: r.error, path: ["stockMinimo"] });
        return z.NEVER;
      }
      return { ...resto, stockMinimo: r.valor };
    });
}

export type EntradaProducto = z.input<ReturnType<typeof esquemaProducto>>;
export type DatosProducto = z.output<ReturnType<typeof esquemaProducto>>;
