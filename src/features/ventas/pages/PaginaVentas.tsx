import { Plus, ShoppingCart, X } from "lucide-react";
import { Link } from "react-router";

import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { errorDeConsultas } from "@/api/problema";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { Casilla } from "@/components/ui/Casilla";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Paginacion } from "@/components/ui/Paginacion";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { FiltroCliente } from "@/features/comercial/components/SelectorCliente";
import { SelectorProducto } from "@/features/inventario/components/SelectorProducto";
import { useFiltrosUrl } from "@/lib/filtrosUrl";
import { formatearDineroDe, formatearFecha } from "@/lib/formato";

import { TEXTOS_VENTAS } from "../textos";

const L = TEXTOS_VENTAS.listado;

function FilaVenta({ v }: { v: components["schemas"]["VentaResumenVista"] }) {
  const anulada = v.estado === "ANULADA";
  return (
    <li className="border-b border-divisor">
      <Link
        to={`/ventas/${String(v.id)}`}
        className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-3 text-tinta no-underline hover:bg-tenue hover:text-tinta"
      >
        <div className="flex min-w-[220px] flex-[2] flex-col">
          <span className="flex items-center gap-2 font-medium">
            {v.consecutivo} · {v.cliente}
            {anulada && <Etiqueta tono="peligro">{L.anulada}</Etiqueta>}
          </span>
          <span className="text-xs text-neutro-700">
            {[v.fecha ? formatearFecha(v.fecha) : null, v.registradaPor].filter(Boolean).join(" · ")}
          </span>
          {v.productos && <span className="text-xs text-neutro-700">{v.productos}</span>}
        </div>
        <div className="flex min-w-[140px] flex-col text-right">
          <span className={anulada ? "font-medium text-neutro-600 line-through" : "font-medium"}>
            {v.total ? formatearDineroDe(v.total) : "—"}
          </span>
          {v.totalUsd && v.moneda !== "USD" && (
            <span className="text-xs text-neutro-700">{formatearDineroDe(v.totalUsd)}</span>
          )}
          {v.utilidad && !anulada && (
            <span className="text-[11px] text-acento-700">{L.utilidad(formatearDineroDe(v.utilidad))}</span>
          )}
        </div>
      </Link>
    </li>
  );
}

/** Ventas (RF-105): por defecto el mes en curso, con los totales y la utilidad del período (RF-73). */
export function Component() {
  const filtros = useFiltrosUrl();
  const cliente = filtros.leer("cliente");
  const clienteNombre = filtros.leer("clienteNombre");
  const producto = filtros.leer("producto");
  const productoNombre = filtros.leer("productoNombre");
  const desde = filtros.leer("desde");
  const hasta = filtros.leer("hasta");
  const incluirAnuladas = filtros.leer("anuladas") !== "no";
  const consulta = $api.useQuery("get", "/api/v1/ventas", {
    params: {
      query: {
        page: filtros.paginaApi,
        size: 20,
        incluirAnuladas,
        ...(cliente ? { clienteId: Number(cliente) } : {}),
        ...(producto ? { productoId: Number(producto) } : {}),
        ...(desde ? { desde } : {}),
        ...(hasta ? { hasta } : {}),
      },
    },
  });
  const error = errorDeConsultas(consulta);
  const datos = consulta.data;
  const ventas = datos?.ventas?.contenido ?? [];

  return (
    <>
      <EncabezadoPagina
        titulo={TEXTOS_VENTAS.titulo}
        acciones={
          <EnlaceBoton a="/ventas/nueva" variante="primario" icono={<Plus aria-hidden size={16} />}>
            {L.nueva}
          </EnlaceBoton>
        }
      />
      <div className="flex flex-wrap items-end gap-3">
        <FiltroCliente
          nombre={cliente ? clienteNombre || cliente : null}
          alElegir={(c) => {
            filtros.cambiar({ cliente: String(c.id), clienteNombre: c.nombre ?? "" });
          }}
          alQuitar={() => {
            filtros.cambiar({ cliente: "", clienteNombre: "" });
          }}
        />
        {producto ? (
          <Boton
            aria-label={L.quitarFiltro(`${L.producto}: ${productoNombre}`)}
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
                  {t.total?.moneda} · {L.ventas(t.ventas ?? 0)}
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
            <div>
              <dt className="text-xs text-neutro-700">{L.utilidadUsd}</dt>
              <dd className="m-0 font-titulo text-xl font-semibold">
                {datos.utilidadUsd ? formatearDineroDe(datos.utilidadUsd) : "—"}
              </dd>
            </div>
          </dl>
          <span className="text-xs text-neutro-700">{L.nota}</span>
        </Tarjeta>
      )}

      {error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista />
      ) : ventas.length === 0 ? (
        <EstadoVacio icono={<ShoppingCart aria-hidden size={28} />} titulo={L.vacio} />
      ) : (
        <>
          <ul aria-label={L.lista} className="m-0 flex list-none flex-col border-t border-divisor p-0">
            {ventas.map((v) => (
              <FilaVenta key={v.id} v={v} />
            ))}
          </ul>
          <Paginacion
            pagina={filtros.pagina}
            totalPaginas={datos?.ventas?.totalPaginas ?? 1}
            alCambiar={filtros.cambiarPagina}
          />
        </>
      )}
    </>
  );
}
