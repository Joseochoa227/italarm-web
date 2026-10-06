import { z } from "zod";

/**
 * Filas del historial del cliente (RF-77). El contrato las describe mal por la colisión de nombres
 * `Movimiento` (D-05, plan de la Fase 1), así que se validan aquí con los campos reales del backend
 * (MovimientosCliente.Movimiento). Las filas sin consecutivo o con otra forma se descartan.
 */
const esquemaMovimiento = z.object({
  tipo: z.string().nullish(),
  id: z.number().nullish(),
  consecutivo: z.string(),
  fecha: z.string().nullish(),
  descripcion: z.string().nullish(),
  total: z
    .object({ monto: z.string().optional(), moneda: z.enum(["USD", "COP", "VES"]).optional() })
    .nullish(),
  estado: z.string().nullish(),
});

export type MovimientoCliente = z.infer<typeof esquemaMovimiento>;

export function leerMovimientos(movimientos: unknown): MovimientoCliente[] {
  if (!Array.isArray(movimientos)) return [];
  return movimientos.flatMap((m) => {
    const r = esquemaMovimiento.safeParse(m);
    return r.success ? [r.data] : [];
  });
}
