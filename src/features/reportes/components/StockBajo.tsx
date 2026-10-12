import { Link } from "react-router";

import type { components } from "@/api/esquema";
import { formatearCantidad } from "@/lib/formato";

import { TEXTOS_REPORTES } from "../textos";

const T = TEXTOS_REPORTES.stock;

/** Nivel para la barra, de 0 a 100 (el backend lo da como stock ÷ mínimo en porcentaje). */
function porcentaje(nivel: string | undefined): number {
  const valor = Number(nivel ?? "0");
  return Number.isFinite(valor) ? Math.min(100, Math.max(0, valor)) : 0;
}

/** Productos por debajo del mínimo con stock, mínimo y barra de nivel (RF-10, RF-140). */
export function ListaStockBajo({ productos }: { productos: components["schemas"]["StockBajoVista"][] }) {
  if (productos.length === 0) return <p className="m-0 text-sm text-neutro-700">{T.vacio}</p>;
  return (
    <ul aria-label={T.titulo} className="m-0 flex list-none flex-col p-0">
      {productos.map((p) => {
        const nivel = porcentaje(p.nivel);
        const unidad = p.unidad ? ` ${p.unidad}` : "";
        return (
          <li key={p.productoId} className="border-t border-tinta/8">
            <Link
              to={`/inventario/productos/${String(p.productoId)}`}
              className="flex min-h-[44px] flex-col gap-1.5 py-3 text-tinta no-underline hover:text-tinta"
            >
              <span className="flex gap-2">
                <span className="flex-1 font-medium">{p.nombre}</span>
                <span className="text-[13px]">
                  {T.nivel(
                    `${p.stock ? formatearCantidad(p.stock) : "0"}${unidad}`,
                    p.minimo ? formatearCantidad(p.minimo) : "0",
                  )}
                </span>
              </span>
              <span
                role="meter"
                aria-label={T.nivelAccesible(p.nombre ?? "", String(Math.round(nivel)))}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(nivel)}
                className="h-1 w-full rounded-sm bg-neutro-200"
              >
                <span className="block h-full rounded-sm bg-acento" style={{ width: `${String(nivel)}%` }} />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
