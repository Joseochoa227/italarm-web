import type { useFiltrosUrl } from "@/lib/filtrosUrl";

import type { usePeriodo } from "./periodo";

export const TIPOS_UTILIDAD = ["VENTA", "INSTALACION"] as const;

/** Filtros de utilidad por documento leídos de la URL (también los usa el botón Excel). */
export function filtrosUtilidad(periodo: ReturnType<typeof usePeriodo>) {
  const { filtros, consulta } = periodo;
  const tipo = TIPOS_UTILIDAD.find((t) => t === filtros.leer("tipo"));
  const { tipo: periodoTipo, ...resto } = consulta;
  return {
    periodo: periodoTipo,
    ...resto,
    ...(tipo ? { tipo } : {}),
    ...(filtros.leer("orden") === "utilidad" ? { ordenarPorUtilidad: true } : {}),
  };
}

export const ESTADOS_SERIAL = ["EN_BODEGA", "VENDIDO", "INSTALADO", "DADO_DE_BAJA", "ANULADO"] as const;

/** Filtros de seriales leídos de la URL (también los usa el botón Excel). */
export function filtrosSeriales(filtros: ReturnType<typeof useFiltrosUrl>) {
  const estado = ESTADOS_SERIAL.find((e) => e === filtros.leer("estado"));
  const producto = filtros.leer("producto");
  return { ...(estado ? { estado } : {}), ...(producto ? { productoId: Number(producto) } : {}) };
}
