import { X } from "lucide-react";
import { Link } from "react-router";

import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { Boton } from "@/components/ui/Boton";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Paginacion } from "@/components/ui/Paginacion";
import { Selector } from "@/components/ui/Selector";
import { SelectorProducto } from "@/features/inventario/components/SelectorProducto";
import type { useFiltrosUrl } from "@/lib/filtrosUrl";
import { formatearFecha } from "@/lib/formato";

import { ESTADOS_SERIAL, filtrosSeriales } from "../hooks/filtros";
import { TEXTOS_REPORTES } from "../textos";

const S = TEXTOS_REPORTES.seriales;
/**
 * Consulta de seriales (RF-141): cuántos hay en bodega, vendidos e instalados, y el listado
 * filtrable por estado y producto, con su entrada, salida y garantía.
 */
export function ReporteSeriales({ filtros }: { filtros: ReturnType<typeof useFiltrosUrl> }) {
  const producto = filtros.leer("producto");
  const productoNombre = filtros.leer("productoNombre");
  const consulta = $api.useQuery("get", "/api/v1/reportes/seriales", {
    params: { query: { ...filtrosSeriales(filtros), page: filtros.paginaApi, size: 20 } },
  });
  const error = errorDeConsultas(consulta);
  const datos = consulta.data;
  const seriales = datos?.seriales?.contenido ?? [];

  return (
    <div className="flex flex-col gap-4">
      {datos && (
        <dl aria-label={S.conteo} className="m-0 grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
          {(datos.porEstado ?? []).map((e) => (
            <div key={e.estado} className="rounded-lg border border-borde bg-tarjeta p-4 shadow-sm">
              <dt className="text-[11px] tracking-[0.08em] text-neutro-700 uppercase">
                {S.estados[e.estado ?? ""] ?? e.estado}
              </dt>
              <dd className="m-0 font-titulo text-[28px] leading-tight font-semibold">{e.cantidad ?? 0}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <Selector
          etiqueta={S.estado}
          vacio={S.todos}
          opciones={ESTADOS_SERIAL.map((e) => ({ valor: e, etiqueta: S.estados[e] ?? e }))}
          value={filtros.leer("estado")}
          onChange={(e) => {
            filtros.cambiar({ estado: e.target.value });
          }}
          className="w-[190px]"
        />
        {producto ? (
          <Boton
            aria-label={S.quitarProducto(productoNombre || producto)}
            onClick={() => {
              filtros.cambiar({ producto: "", productoNombre: "" });
            }}
          >
            {S.producto}: {productoNombre || producto}
            <X aria-hidden size={16} />
          </Boton>
        ) : (
          <SelectorProducto
            etiqueta={S.producto}
            soloActivos={false}
            alElegir={(p) => {
              filtros.cambiar({ producto: String(p.id), productoNombre: p.nombre ?? "" });
            }}
          />
        )}
      </div>
      {error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista />
      ) : seriales.length === 0 ? (
        <EstadoVacio titulo={S.vacio} />
      ) : (
        <>
          <ul aria-label={S.lista} className="m-0 flex list-none flex-col border-t border-divisor p-0">
            {seriales.map((s) => (
              <li key={s.id} className="border-b border-divisor">
                <Link
                  to={`/seriales/${String(s.id)}`}
                  className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-3 text-tinta no-underline hover:bg-tenue hover:text-tinta"
                >
                  <div className="flex min-w-[200px] flex-[2] flex-col">
                    <span className="font-mono font-medium">{s.numero}</span>
                    <span className="text-xs text-neutro-700">
                      {[s.codigoProducto, s.producto].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <div className="flex min-w-[200px] flex-1 flex-col text-xs text-neutro-700">
                    {s.entrada && (
                      <span>
                        {S.entrada(s.entrada, s.fechaEntrada ? formatearFecha(s.fechaEntrada) : "")}
                      </span>
                    )}
                    {s.salida && <span>{S.salida(s.salida)}</span>}
                    {s.vencimientoGarantia && (
                      <span>{S.garantia(formatearFecha(s.vencimientoGarantia))}</span>
                    )}
                  </div>
                  <span className="text-sm">{S.estados[s.estado ?? ""] ?? s.estado}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Paginacion
            pagina={filtros.pagina}
            totalPaginas={datos?.seriales?.totalPaginas ?? 1}
            alCambiar={filtros.cambiarPagina}
          />
        </>
      )}
    </div>
  );
}
