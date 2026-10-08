import { Paperclip, Plus, ShoppingCart, X } from "lucide-react";
import { Link } from "react-router";

import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { errorDeConsultas } from "@/api/problema";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Casilla } from "@/components/ui/Casilla";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Paginacion } from "@/components/ui/Paginacion";
import { Selector } from "@/components/ui/Selector";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { SelectorProducto } from "@/features/inventario/components/SelectorProducto";
import { useFiltrosUrl } from "@/lib/filtrosUrl";
import { formatearDineroDe, formatearFecha } from "@/lib/formato";

import { textoTasas } from "../formato";
import { TEXTOS_COMPRAS } from "../textos";

const L = TEXTOS_COMPRAS.listado;
type Resumen = components["schemas"]["CompraResumenVista"];

function FilaCompra({ c }: { c: Resumen }) {
  const anulada = c.estado === "ANULADA";
  return (
    <li className="flex items-center gap-3 border-b border-divisor px-2 py-3">
      <Link
        to={`/compras/${String(c.id)}`}
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-1 text-tinta no-underline hover:text-tinta"
      >
        <div className="flex min-w-[200px] flex-[2] flex-col">
          <span className="flex items-center gap-2 font-medium">
            {c.consecutivo} · {c.proveedor?.nombre}
            {anulada && <Etiqueta tono="peligro">{L.anulada}</Etiqueta>}
          </span>
          <span className="text-xs text-neutro-700">
            {[
              c.fecha ? formatearFecha(c.fecha) : null,
              c.numeroFactura ? L.factura(c.numeroFactura) : null,
              c.registradaPor,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          {c.productos && <span className="text-xs text-neutro-700">{c.productos}</span>}
        </div>
        <div className="flex min-w-[140px] flex-col text-right">
          <span className={anulada ? "font-medium text-neutro-600 line-through" : "font-medium"}>
            {c.total ? formatearDineroDe(c.total) : "—"}
          </span>
          {c.totalUsd && c.moneda !== "USD" && (
            <span className="text-xs text-neutro-700">{formatearDineroDe(c.totalUsd)}</span>
          )}
          {c.moneda !== "USD" && <span className="text-[11px] text-neutro-700">{textoTasas(c.tasas)}</span>}
        </div>
      </Link>
      {c.facturaUrl ? (
        <a
          href={c.facturaUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${L.verFactura} ${c.consecutivo ?? ""}`}
          className="grid size-[44px] shrink-0 place-items-center rounded-md text-acento-700 hover:bg-acento/10"
        >
          <Paperclip aria-hidden size={18} />
        </a>
      ) : (
        <span className="size-[44px] shrink-0" />
      )}
    </li>
  );
}

/** Listado de compras (RF-46, RF-47): por defecto el mes en curso, con los totales del período (RF-73). */
export function ListaCompras() {
  const filtros = useFiltrosUrl();
  const proveedor = filtros.leer("proveedor");
  const producto = filtros.leer("producto");
  const productoNombre = filtros.leer("productoNombre");
  const desde = filtros.leer("desde");
  const hasta = filtros.leer("hasta");
  const incluirAnuladas = filtros.leer("anuladas") !== "no";

  const proveedores = $api.useQuery("get", "/api/v1/proveedores", { params: { query: { size: 100 } } });
  const consulta = $api.useQuery("get", "/api/v1/compras", {
    params: {
      query: {
        page: filtros.paginaApi,
        size: 20,
        incluirAnuladas,
        ...(proveedor ? { proveedorId: Number(proveedor) } : {}),
        ...(producto ? { productoId: Number(producto) } : {}),
        ...(desde ? { desde } : {}),
        ...(hasta ? { hasta } : {}),
      },
    },
  });
  const error = errorDeConsultas(consulta);
  const datos = consulta.data;
  const compras = datos?.compras?.contenido ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Selector
          etiqueta={L.proveedor}
          vacio={L.todosProveedores}
          value={proveedor}
          opciones={(proveedores.data?.contenido ?? []).map((p) => ({
            valor: String(p.id),
            etiqueta: p.nombre ?? "",
          }))}
          onChange={(e) => {
            filtros.cambiar({ proveedor: e.target.value });
          }}
          className="min-w-[200px] flex-1"
        />
        <Campo
          etiqueta={L.desde}
          type="date"
          value={desde || (datos?.desde ?? "")}
          onChange={(e) => {
            filtros.cambiar({ desde: e.target.value });
          }}
          className="w-[160px]"
        />
        <Campo
          etiqueta={L.hasta}
          type="date"
          value={hasta || (datos?.hasta ?? "")}
          onChange={(e) => {
            filtros.cambiar({ hasta: e.target.value });
          }}
          className="w-[160px]"
        />
        <EnlaceBoton a="/compras/nueva" variante="primario" icono={<Plus aria-hidden size={16} />}>
          {L.nueva}
        </EnlaceBoton>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {producto ? (
          <Boton
            variante="secundario"
            aria-label={`${L.producto}: ${productoNombre}. Quitar filtro`}
            onClick={() => {
              filtros.cambiar({ producto: "", productoNombre: "" });
            }}
          >
            {L.producto}: {productoNombre}
            <X aria-hidden size={16} />
          </Boton>
        ) : (
          <SelectorProducto
            etiqueta={L.producto}
            soloActivos={false}
            alElegir={(p) => {
              filtros.cambiar({ producto: String(p.id), productoNombre: p.nombre ?? "" });
            }}
          />
        )}
        <Casilla
          etiqueta={L.incluirAnuladas}
          checked={incluirAnuladas}
          onChange={(e) => {
            filtros.cambiar({ anuladas: e.target.checked ? "" : "no" });
          }}
        />
      </div>

      {datos && (
        <Tarjeta aria-label={L.totales} role="region">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <span className="rotulo text-acento-700">{L.totales}</span>
            {datos.desde && datos.hasta && (
              <span className="text-sm text-neutro-700">
                {L.periodo(formatearFecha(datos.desde), formatearFecha(datos.hasta))}
              </span>
            )}
          </div>
          <dl className="m-0 flex flex-wrap gap-x-8 gap-y-3">
            {(datos.totalesPorMoneda ?? []).map((t) => (
              <div key={t.total?.moneda}>
                <dt className="text-xs text-neutro-700">
                  {t.total?.moneda} · {L.compras(t.compras ?? 0)}
                </dt>
                <dd className="m-0 font-titulo text-xl font-semibold">
                  {t.total ? formatearDineroDe(t.total) : "—"}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-xs text-neutro-700">{L.totalUsd}</dt>
              <dd className="m-0 font-titulo text-xl font-semibold">
                {datos.totalUsd ? formatearDineroDe(datos.totalUsd) : "—"}
              </dd>
            </div>
          </dl>
          <span className="text-xs text-neutro-700">{L.totalesNota}</span>
        </Tarjeta>
      )}

      {error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista />
      ) : compras.length === 0 ? (
        <EstadoVacio icono={<ShoppingCart aria-hidden size={28} />} titulo={L.vacio} />
      ) : (
        <>
          <ul aria-label={L.lista} className="m-0 flex list-none flex-col border-t border-divisor p-0">
            {compras.map((c) => (
              <FilaCompra key={c.id} c={c} />
            ))}
          </ul>
          <Paginacion
            pagina={filtros.pagina}
            totalPaginas={datos?.compras?.totalPaginas ?? 1}
            alCambiar={filtros.cambiarPagina}
          />
        </>
      )}
    </div>
  );
}
