import type { components } from "@/api/esquema";
import { Celda, Tabla } from "@/components/ui/Tabla";
import { maximoDecimal, proporcion } from "@/lib/decimal";
import { formatearDineroDe } from "@/lib/formato";

import { TEXTOS_REPORTES } from "../textos";

const R = TEXTOS_REPORTES.resumen;
type Barra = components["schemas"]["ReportePeriodoVistaBarra"];
const monto = (d: components["schemas"]["Dinero"] | undefined) => d?.monto ?? "0";
const dinero = (d: components["schemas"]["Dinero"] | undefined) => (d ? formatearDineroDe(d) : "—");

/**
 * Barras de ventas e instalaciones por semana o por mes (RF-137, P-60), en USD. Se dibujan con
 * HTML y CSS (sin librería, BF-12); cada barra tiene su texto para lectores de pantalla y debajo
 * está la tabla con los números exactos.
 */
export function GraficoSerie({ serie }: { serie: Barra[] }) {
  const maximo = maximoDecimal(serie.flatMap((b) => [monto(b.totalVentas), monto(b.totalInstalaciones)]));
  if (serie.length === 0 || maximo === "0")
    return <p className="m-0 text-sm text-neutro-700">{R.sinMovimiento}</p>;
  return (
    <div className="flex flex-col gap-3">
      <ul
        aria-label={R.grafico}
        className="m-0 flex h-[200px] list-none items-end gap-3 border-b border-divisor bg-[linear-gradient(color-mix(in_srgb,#1d1f20_6%,transparent)_1px,transparent_1px)] bg-[length:100%_50px] p-0"
      >
        {serie.map((b) => (
          <li
            key={b.desde ?? b.etiqueta}
            aria-label={R.barra(b.etiqueta ?? "", dinero(b.totalVentas), dinero(b.totalInstalaciones))}
            className="flex h-full flex-1 items-end justify-center gap-1"
          >
            <span
              className="block w-[min(22px,35%)] rounded-t-[3px] bg-acento-700"
              style={{ height: `${String(proporcion(monto(b.totalVentas), maximo))}%` }}
            />
            <span
              className="block w-[min(22px,35%)] rounded-t-[3px] bg-acento-300"
              style={{ height: `${String(proporcion(monto(b.totalInstalaciones), maximo))}%` }}
            />
          </li>
        ))}
      </ul>
      <div aria-hidden className="-mt-1 flex gap-3">
        {serie.map((b) => (
          <span key={b.desde ?? b.etiqueta} className="flex-1 text-center text-xs text-neutro-700">
            {b.etiqueta}
          </span>
        ))}
      </div>
      <details>
        <summary className="min-h-[44px] cursor-pointer content-center text-sm text-acento-700">
          {R.verNumeros}
        </summary>
        <Tabla etiqueta={R.grafico} columnas={R.columnasSerie}>
          {serie.map((b) => (
            <tr key={b.desde ?? b.etiqueta} className="border-b border-tinta/8">
              <Celda>{b.etiqueta}</Celda>
              <Celda derecha>{b.ventas ?? 0}</Celda>
              <Celda derecha>{dinero(b.totalVentas)}</Celda>
              <Celda derecha>{b.instalaciones ?? 0}</Celda>
              <Celda derecha>{dinero(b.totalInstalaciones)}</Celda>
            </tr>
          ))}
        </Tabla>
      </details>
    </div>
  );
}

/** Leyenda del gráfico: el color nunca va solo (BF-11). */
export function LeyendaSerie() {
  return (
    <div className="flex gap-4 text-xs">
      <span className="flex items-center gap-1.5">
        <i aria-hidden className="block size-2.5 rounded-[2px] bg-acento-700" />
        {R.leyendaVentas}
      </span>
      <span className="flex items-center gap-1.5">
        <i aria-hidden className="block size-2.5 rounded-[2px] bg-acento-300" />
        {R.leyendaInstalaciones}
      </span>
    </div>
  );
}

/** Lista con barras horizontales proporcionales al valor (más vendidos, compras por proveedor). */
export function BarrasHorizontales({
  etiqueta,
  filas,
  vacio,
  oscuro = false,
}: {
  etiqueta: string;
  filas: { clave: string; nombre: string; valor: string; detalle: string }[];
  vacio: string;
  oscuro?: boolean;
}) {
  if (filas.length === 0) return <p className="m-0 text-sm text-neutro-700">{vacio}</p>;
  const maximo = maximoDecimal(filas.map((f) => f.valor));
  return (
    <ul aria-label={etiqueta} className="m-0 flex list-none flex-col gap-3 p-0">
      {filas.map((f) => (
        <li key={f.clave} className="flex flex-col gap-1">
          <span className="flex justify-between gap-3 text-sm">
            <span>{f.nombre}</span>
            <span className="text-right font-medium">{f.detalle}</span>
          </span>
          <span aria-hidden className="h-1.5 rounded-[3px] bg-neutro-200">
            <span
              className={
                oscuro ? "block h-full rounded-[3px] bg-acento-700" : "block h-full rounded-[3px] bg-acento"
              }
              style={{ width: `${String(proporcion(f.valor, maximo))}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
