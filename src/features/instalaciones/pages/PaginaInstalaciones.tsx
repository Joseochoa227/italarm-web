import { Plus, ShieldCheck, Wrench } from "lucide-react";
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
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Paginacion } from "@/components/ui/Paginacion";
import { Selector } from "@/components/ui/Selector";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { FiltroCliente } from "@/features/comercial/components/SelectorCliente";
import { useFiltrosUrl } from "@/lib/filtrosUrl";
import { formatearDineroDe, formatearFecha } from "@/lib/formato";

import { TEXTOS_INSTALACIONES } from "../textos";

const T = TEXTOS_INSTALACIONES;
const L = T.listado;
const ESTADOS = ["VIGENTE", "POR_VENCER", "VENCIDA"] as const;

function FilaInstalacion({ i }: { i: components["schemas"]["InstalacionResumenVista"] }) {
  const anulada = i.estado === "ANULADA";
  return (
    <li className="border-b border-divisor">
      <Link
        to={`/instalaciones/${String(i.id)}`}
        className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-3 text-tinta no-underline hover:bg-tenue hover:text-tinta"
      >
        <div className="flex min-w-[220px] flex-[2] flex-col">
          <span className="flex flex-wrap items-center gap-2 font-medium">
            {i.consecutivo} · {i.cliente}
            {anulada ? (
              <Etiqueta tono="peligro">{L.anulada}</Etiqueta>
            ) : (
              i.estadoGarantia && (
                <Etiqueta
                  tono={
                    i.estadoGarantia === "VIGENTE"
                      ? "acento"
                      : i.estadoGarantia === "VENCIDA"
                        ? "neutro"
                        : "contorno"
                  }
                >
                  {T.estadosGarantia[i.estadoGarantia]}
                </Etiqueta>
              )
            )}
          </span>
          <span className="text-xs text-neutro-700">
            {[i.fecha ? formatearFecha(i.fecha) : null, i.direccion, i.tecnicos].filter(Boolean).join(" · ")}
          </span>
        </div>
        <div className="flex min-w-[140px] flex-col text-right">
          <span className={anulada ? "font-medium text-neutro-600 line-through" : "font-medium"}>
            {i.total ? formatearDineroDe(i.total) : "—"}
          </span>
          {i.totalUsd && i.moneda !== "USD" && (
            <span className="text-xs text-neutro-700">{formatearDineroDe(i.totalUsd)}</span>
          )}
          {i.utilidad && !anulada && (
            <span className="text-[11px] text-acento-700">{L.utilidad(formatearDineroDe(i.utilidad))}</span>
          )}
        </div>
      </Link>
    </li>
  );
}

/** Instalaciones (RF-121): por defecto el mes en curso; filtros por cliente, técnico, fecha y garantía. */
export function Component() {
  const filtros = useFiltrosUrl();
  const cliente = filtros.leer("cliente");
  const clienteNombre = filtros.leer("clienteNombre");
  const tecnico = filtros.leer("tecnico");
  const garantia = filtros.leer("garantia");
  const desde = filtros.leer("desde");
  const hasta = filtros.leer("hasta");
  const incluirAnuladas = filtros.leer("anuladas") !== "no";
  const tecnicos = $api.useQuery("get", "/api/v1/usuarios/tecnicos");
  const estadoGarantia = ESTADOS.find((e) => e === garantia);
  const consulta = $api.useQuery("get", "/api/v1/instalaciones", {
    params: {
      query: {
        page: filtros.paginaApi,
        size: 20,
        incluirAnuladas,
        ...(cliente ? { clienteId: Number(cliente) } : {}),
        ...(tecnico ? { tecnicoId: Number(tecnico) } : {}),
        ...(estadoGarantia ? { estadoGarantia } : {}),
        ...(desde ? { desde } : {}),
        ...(hasta ? { hasta } : {}),
      },
    },
  });
  const error = errorDeConsultas(consulta);
  const datos = consulta.data;
  const instalaciones = datos?.instalaciones?.contenido ?? [];

  return (
    <>
      <EncabezadoPagina
        titulo={T.titulo}
        acciones={
          <>
            <EnlaceBoton a="/garantias" icono={<ShieldCheck aria-hidden size={16} />}>
              {L.garantias}
            </EnlaceBoton>
            <EnlaceBoton a="/instalaciones/nueva" variante="primario" icono={<Plus aria-hidden size={16} />}>
              {L.nueva}
            </EnlaceBoton>
          </>
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
        <Selector
          etiqueta={L.tecnico}
          vacio={L.todosTecnicos}
          value={tecnico}
          opciones={(tecnicos.data ?? []).map((t) => ({ valor: String(t.id), etiqueta: t.nombre ?? "" }))}
          onChange={(e) => {
            filtros.cambiar({ tecnico: e.target.value });
          }}
          className="min-w-[170px]"
        />
        <Selector
          etiqueta={L.estadoGarantia}
          vacio={L.todas}
          value={garantia}
          opciones={ESTADOS.map((e) => ({ valor: e, etiqueta: T.estadosGarantia[e] ?? e }))}
          onChange={(e) => {
            filtros.cambiar({ garantia: e.target.value });
          }}
          className="min-w-[150px]"
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
                  {t.total?.moneda} · {L.instalaciones(t.instalaciones ?? 0)}
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
      ) : instalaciones.length === 0 ? (
        <EstadoVacio icono={<Wrench aria-hidden size={28} />} titulo={L.vacio} />
      ) : (
        <>
          <ul aria-label={L.lista} className="m-0 flex list-none flex-col border-t border-divisor p-0">
            {instalaciones.map((i) => (
              <FilaInstalacion key={i.id} i={i} />
            ))}
          </ul>
          <Paginacion
            pagina={filtros.pagina}
            totalPaginas={datos?.instalaciones?.totalPaginas ?? 1}
            alCambiar={filtros.cambiarPagina}
          />
        </>
      )}
    </>
  );
}
