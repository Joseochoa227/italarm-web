import { FileText, Plus } from "lucide-react";
import { Link } from "react-router";

import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { errorDeConsultas } from "@/api/problema";
import { Campo } from "@/components/ui/Campo";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { Casilla } from "@/components/ui/Casilla";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Paginacion } from "@/components/ui/Paginacion";
import { Selector } from "@/components/ui/Selector";
import { FiltroCliente } from "@/features/comercial/components/SelectorCliente";
import { cx } from "@/lib/clases";
import { useFiltrosUrl } from "@/lib/filtrosUrl";
import { formatearDineroDe, formatearFecha } from "@/lib/formato";

import { EstadoCotizacion } from "../components/EstadoCotizacion";
import { TEXTOS_COTIZACIONES } from "../textos";

const L = TEXTOS_COTIZACIONES.listado;
const ESTADOS = ["BORRADOR", "EN_EVALUACION", "APROBADA", "CONVERTIDA", "RECHAZADA", "VENCIDA"] as const;
const TIPOS = ["INSTALACION", "VENTA"] as const;
type Estado = (typeof ESTADOS)[number];
type Tipo = (typeof TIPOS)[number];

function FilaCotizacion({ c }: { c: components["schemas"]["CotizacionResumenVista"] }) {
  return (
    <li className={cx("border-b border-divisor", c.porVencer && "bg-acento/7")}>
      <Link
        to={`/cotizaciones/${String(c.id)}`}
        className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-3 text-tinta no-underline hover:bg-tenue hover:text-tinta"
      >
        <div className="flex min-w-[220px] flex-[2] flex-col">
          <span className="flex flex-wrap items-center gap-2 font-medium">
            {c.consecutivo} · {c.cliente}
            <EstadoCotizacion estado={c.estado} />
          </span>
          <span className="text-xs text-neutro-700">
            {[
              c.tipo ? TEXTOS_COTIZACIONES.tipos[c.tipo] : null,
              c.fecha ? formatearFecha(c.fecha) : null,
              c.registradaPor,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          {c.documentoGenerado && (
            <span className="text-xs text-acento-700">{L.documento(c.documentoGenerado)}</span>
          )}
        </div>
        <div className="flex min-w-[140px] flex-col text-right">
          <span className="font-medium">{c.total ? formatearDineroDe(c.total) : "—"}</span>
          {c.totalUsd && c.moneda !== "USD" && (
            <span className="text-xs text-neutro-700">{formatearDineroDe(c.totalUsd)}</span>
          )}
          {c.diasParaVencer !== undefined && (
            <span
              className={cx("text-xs", c.porVencer ? "font-semibold text-acento-700" : "text-neutro-700")}
            >
              {L.dias(c.diasParaVencer)}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

/**
 * Cotizaciones (RF-89 a RF-91): filtros por estado, cliente, tipo, fechas y por vencer; cada una con
 * sus días para vencer, y resaltadas las que vencen en 3 días o menos.
 */
export function Component() {
  const filtros = useFiltrosUrl();
  const estado = filtros.leer("estado");
  const tipo = filtros.leer("tipo");
  const cliente = filtros.leer("cliente");
  const clienteNombre = filtros.leer("clienteNombre");
  const desde = filtros.leer("desde");
  const hasta = filtros.leer("hasta");
  const porVencer = filtros.leer("porVencer") === "si";
  const consulta = $api.useQuery("get", "/api/v1/cotizaciones", {
    params: {
      query: {
        page: filtros.paginaApi,
        size: 20,
        ...((ESTADOS as readonly string[]).includes(estado) ? { estado: estado as Estado } : {}),
        ...((TIPOS as readonly string[]).includes(tipo) ? { tipo: tipo as Tipo } : {}),
        ...(cliente ? { clienteId: Number(cliente) } : {}),
        ...(desde ? { desde } : {}),
        ...(hasta ? { hasta } : {}),
        ...(porVencer ? { porVencer: true } : {}),
      },
    },
  });
  const error = errorDeConsultas(consulta);
  const cotizaciones = consulta.data?.contenido ?? [];

  return (
    <>
      <EncabezadoPagina
        titulo={TEXTOS_COTIZACIONES.titulo}
        acciones={
          <EnlaceBoton a="/cotizaciones/nueva" variante="primario" icono={<Plus aria-hidden size={16} />}>
            {L.nueva}
          </EnlaceBoton>
        }
      />
      <div className="flex flex-wrap items-end gap-3">
        <Selector
          etiqueta={L.estado}
          vacio={L.todos}
          opciones={ESTADOS.map((e) => ({ valor: e, etiqueta: TEXTOS_COTIZACIONES.estados[e] ?? e }))}
          value={estado}
          onChange={(e) => {
            filtros.cambiar({ estado: e.target.value });
          }}
          className="w-[170px]"
        />
        <Selector
          etiqueta={L.tipo}
          vacio={L.todos}
          opciones={TIPOS.map((t) => ({ valor: t, etiqueta: TEXTOS_COTIZACIONES.tipos[t] ?? t }))}
          value={tipo}
          onChange={(e) => {
            filtros.cambiar({ tipo: e.target.value });
          }}
          className="w-[190px]"
        />
        <FiltroCliente
          nombre={cliente ? clienteNombre || cliente : null}
          alElegir={(c) => {
            filtros.cambiar({ cliente: String(c.id), clienteNombre: c.nombre ?? "" });
          }}
          alQuitar={() => {
            filtros.cambiar({ cliente: "", clienteNombre: "" });
          }}
        />
        <Campo
          etiqueta={L.desde}
          type="date"
          value={desde}
          onChange={(e) => {
            filtros.cambiar({ desde: e.target.value });
          }}
          className="w-[160px]"
        />
        <Campo
          etiqueta={L.hasta}
          type="date"
          value={hasta}
          onChange={(e) => {
            filtros.cambiar({ hasta: e.target.value });
          }}
          className="w-[160px]"
        />
        <Casilla
          etiqueta={L.porVencer}
          checked={porVencer}
          onChange={(e) => {
            filtros.cambiar({ porVencer: e.target.checked ? "si" : "" });
          }}
        />
      </div>

      {error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista />
      ) : cotizaciones.length === 0 ? (
        <EstadoVacio icono={<FileText aria-hidden size={28} />} titulo={L.vacio} />
      ) : (
        <>
          <ul aria-label={L.lista} className="m-0 flex list-none flex-col border-t border-divisor p-0">
            {cotizaciones.map((c) => (
              <FilaCotizacion key={c.id} c={c} />
            ))}
          </ul>
          <Paginacion
            pagina={filtros.pagina}
            totalPaginas={consulta.data?.totalPaginas ?? 1}
            alCambiar={filtros.cambiarPagina}
          />
        </>
      )}
    </>
  );
}
