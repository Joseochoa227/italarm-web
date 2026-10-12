import { Link } from "react-router";

import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { errorDeConsultas } from "@/api/problema";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { Casilla } from "@/components/ui/Casilla";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Paginacion } from "@/components/ui/Paginacion";
import { Selector } from "@/components/ui/Selector";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { formatearDecimal, formatearDineroDe, formatearFecha } from "@/lib/formato";

import { TIPOS_UTILIDAD as TIPOS, filtrosUtilidad } from "../hooks/filtros";
import type { usePeriodo } from "../hooks/periodo";
import { TEXTOS_REPORTES } from "../textos";

const U = TEXTOS_REPORTES.utilidad;

function Total({ titulo, valor }: { titulo: string; valor: components["schemas"]["Dinero"] | undefined }) {
  return (
    <div>
      <dt className="text-xs text-neutro-700">{titulo}</dt>
      <dd className="m-0 font-titulo text-xl font-semibold">{valor ? formatearDineroDe(valor) : "—"}</dd>
    </div>
  );
}

/**
 * Utilidad por venta y por instalación del período (RF-143, P-63): cobrado, costo, utilidad y
 * margen de cada documento y los totales en USD. Filtro por tipo, orden por utilidad y páginas.
 */
export function UtilidadDocumentos({ periodo }: { periodo: ReturnType<typeof usePeriodo> }) {
  const { filtros } = periodo;
  const tipo = filtros.leer("tipo");
  const consulta = $api.useQuery("get", "/api/v1/reportes/utilidad", {
    params: { query: { ...filtrosUtilidad(periodo), page: filtros.paginaApi, size: 20 } },
  });
  const error = errorDeConsultas(consulta);
  const datos = consulta.data;
  const documentos = datos?.documentos?.contenido ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Selector
          etiqueta={U.tipo}
          vacio={U.todos}
          opciones={TIPOS.map((t) => ({ valor: t, etiqueta: U.tipos[t] ?? t }))}
          value={TIPOS.find((t) => t === tipo) ?? ""}
          onChange={(e) => {
            filtros.cambiar({ tipo: e.target.value });
          }}
          className="w-[220px]"
        />
        <Casilla
          etiqueta={U.ordenar}
          checked={filtros.leer("orden") === "utilidad"}
          onChange={(e) => {
            filtros.cambiar({ orden: e.target.checked ? "utilidad" : "" });
          }}
        />
      </div>
      {datos && (
        <Tarjeta role="region" aria-label={U.totales}>
          <dl className="m-0 flex flex-wrap gap-x-8 gap-y-3">
            <Total titulo={U.cobrado} valor={datos.totalUsd} />
            <Total titulo={U.costo} valor={datos.costoUsd} />
            <Total titulo={U.utilidad} valor={datos.utilidadUsd} />
            {datos.porcentajeUtilidad && (
              <div>
                <dt className="text-xs text-neutro-700">{U.margenTitulo}</dt>
                <dd className="m-0 font-titulo text-xl font-semibold">
                  {U.margen(formatearDecimal(datos.porcentajeUtilidad))}
                </dd>
              </div>
            )}
          </dl>
        </Tarjeta>
      )}
      {error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista />
      ) : documentos.length === 0 ? (
        <EstadoVacio titulo={U.vacio} />
      ) : (
        <>
          <ul aria-label={U.lista} className="m-0 flex list-none flex-col border-t border-divisor p-0">
            {documentos.map((d) => (
              <li key={`${d.tipo ?? ""}-${String(d.id)}`} className="border-b border-divisor">
                <Link
                  to={`/${d.tipo === "VENTA" ? "ventas" : "instalaciones"}/${String(d.id)}`}
                  className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-3 text-tinta no-underline hover:bg-tenue hover:text-tinta"
                >
                  <div className="flex min-w-[200px] flex-[2] flex-col">
                    <span className="font-medium">
                      {d.consecutivo} · {d.cliente}
                    </span>
                    <span className="text-xs text-neutro-700">
                      {[U.tipoDocumento[d.tipo ?? ""], d.fecha ? formatearFecha(d.fecha) : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <div className="flex min-w-[140px] flex-col text-right text-sm">
                    <span>
                      {U.cobrado} {d.total ? formatearDineroDe(d.total) : "—"}
                    </span>
                    <span className="text-neutro-700">
                      {U.costo} {d.costo ? formatearDineroDe(d.costo) : "—"}
                    </span>
                  </div>
                  <div className="flex min-w-[140px] flex-col text-right">
                    <span className="font-semibold text-acento-800">
                      {d.utilidad ? formatearDineroDe(d.utilidad) : "—"}
                      {d.porcentajeUtilidad ? ` · ${U.margen(formatearDecimal(d.porcentajeUtilidad))}` : ""}
                    </span>
                    {d.utilidadUsd && d.utilidad?.moneda !== "USD" && (
                      <span className="text-xs text-neutro-700">{formatearDineroDe(d.utilidadUsd)}</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Paginacion
            pagina={filtros.pagina}
            totalPaginas={datos?.documentos?.totalPaginas ?? 1}
            alCambiar={filtros.cambiarPagina}
          />
        </>
      )}
    </div>
  );
}
