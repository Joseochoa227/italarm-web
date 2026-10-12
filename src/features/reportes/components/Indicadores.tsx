import type { components } from "@/api/esquema";
import { formatearDecimal, formatearDineroDe, formatearFecha, separarMonedas } from "@/lib/formato";

import { TEXTOS_REPORTES } from "../textos";

const T = TEXTOS_REPORTES.indicadores;
type Montos = components["schemas"]["MontoEnMonedas"] | undefined;

function Indicador({
  etiqueta,
  montos,
  notas,
}: {
  etiqueta: string;
  montos: Montos;
  notas: (string | null | undefined)[];
}) {
  // P-57: la moneda principal es USD; debajo, los equivalentes en COP y VES con las tasas de hoy.
  const { principal, otros } = separarMonedas(montos, "USD");
  return (
    <div
      role="group"
      aria-label={etiqueta}
      className="flex min-h-[112px] flex-col gap-1 rounded-lg border border-borde bg-tarjeta p-4 shadow-sm"
    >
      <span className="text-[11px] tracking-[0.08em] text-neutro-700 uppercase">{etiqueta}</span>
      <span className="font-titulo text-[28px] leading-tight font-semibold escritorio:text-[30px]">
        {principal}
      </span>
      {otros && <span className="text-xs text-acento-700">{otros}</span>}
      <span className="mt-auto flex flex-col text-xs text-neutro-700">
        {notas.filter(Boolean).map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </div>
  );
}

const cobrado = (porMoneda: components["schemas"]["Dinero"][] | undefined) =>
  (porMoneda ?? []).length > 1
    ? T.cobrado((porMoneda ?? []).map((d) => formatearDineroDe(d)).join(" · "))
    : null;

/**
 * Los cuatro indicadores de Inicio (RF-08) y de Reportes (RF-136): ventas e instalaciones con su
 * cantidad, utilidad con el porcentaje sobre lo cobrado e inventario valorizado, tal como los
 * calcula el backend (BF-06).
 */
export function Indicadores({
  indicadores: i,
  etiquetas,
}: {
  indicadores: components["schemas"]["IndicadoresVista"] | undefined;
  etiquetas: { ventas: string; instalaciones: string; utilidad: string; inventario: string };
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
      <Indicador
        etiqueta={etiquetas.ventas}
        montos={i?.ventas?.total}
        notas={[T.ventas(i?.ventas?.cantidad ?? 0), cobrado(i?.ventas?.porMoneda)]}
      />
      <Indicador
        etiqueta={etiquetas.instalaciones}
        montos={i?.instalaciones?.total}
        notas={[T.instalaciones(i?.instalaciones?.cantidad ?? 0), cobrado(i?.instalaciones?.porMoneda)]}
      />
      <Indicador
        etiqueta={etiquetas.utilidad}
        montos={i?.utilidad?.total}
        notas={[i?.utilidad?.porcentaje ? T.utilidad(formatearDecimal(i.utilidad.porcentaje)) : null]}
      />
      <Indicador
        etiqueta={etiquetas.inventario}
        montos={i?.inventario?.valor}
        notas={[
          T.productos(i?.inventario?.productos ?? 0),
          i?.inventario?.fecha ? T.alDia(formatearFecha(i.inventario.fecha)) : null,
        ]}
      />
    </div>
  );
}
