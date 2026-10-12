import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";

import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { errorDeConsultas } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { Celda, Tabla } from "@/components/ui/Tabla";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { compararDecimales } from "@/lib/decimal";
import {
  formatearCantidad,
  formatearDecimal,
  formatearDineroDe,
  formatearFecha,
  formatearFechaHora,
  separarMonedas,
} from "@/lib/formato";

import { AccionesCotizacion } from "../components/AccionesCotizacion";
import { EstadoCotizacion } from "../components/EstadoCotizacion";
import { TEXTOS_COTIZACIONES } from "../textos";

const D = TEXTOS_COTIZACIONES.detalle;
type Cotizacion = components["schemas"]["CotizacionVista"];
type Moneda = NonNullable<Cotizacion["moneda"]>;

function Dato({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-neutro-700">{titulo}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}

function FilaResumen({
  titulo,
  montos,
  moneda,
  fuerte = false,
}: {
  titulo: string;
  montos: components["schemas"]["MontoEnMonedas"] | undefined;
  moneda: Moneda;
  fuerte?: boolean;
}) {
  const { principal, otros } = separarMonedas(montos, moneda);
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-neutro-700">{titulo}</span>
      <span className="text-right">
        <span className={fuerte ? "font-titulo text-[22px] font-semibold" : ""}>{principal}</span>
        {otros && <span className="block text-[11px] text-neutro-700">{otros}</span>}
      </span>
    </div>
  );
}

const positivo = (montos: components["schemas"]["MontoEnMonedas"] | undefined) =>
  compararDecimales(montos?.usd?.monto ?? "0", "0") > 0;

/** Historial de estados de la cotización (RF-87). */
function Historial({ c }: { c: Cotizacion }) {
  const pasos = [
    c.registradaEn ? D.registradaEl(formatearFechaHora(c.registradaEn)) : null,
    c.enviadaEn ? D.enviadaEl(formatearFechaHora(c.enviadaEn)) : null,
    c.aprobadaEn ? D.aprobadaEl(formatearFechaHora(c.aprobadaEn)) : null,
    c.rechazo?.fecha
      ? D.rechazadaEl(
          formatearFechaHora(c.rechazo.fecha),
          [c.rechazo.motivo ? TEXTOS_COTIZACIONES.motivos[c.rechazo.motivo] : null, c.rechazo.detalle]
            .filter(Boolean)
            .join(": ") || "—",
        )
      : null,
    c.vencidaEl ? D.vencidaEl(formatearFecha(c.vencidaEl)) : null,
  ].filter((p): p is string => p !== null);
  return (
    <section aria-labelledby="titulo-historial" className="flex flex-col gap-2">
      <h2 id="titulo-historial" className="m-0 text-[22px]">
        {D.historial}
      </h2>
      <ol className="m-0 flex flex-col gap-1 pl-5 text-sm">
        {pasos.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
    </section>
  );
}

/** Versiones anteriores de una cotización editada en evaluación (RF-88, P-46). */
function Versiones({ c }: { c: Cotizacion }) {
  const versiones = c.versionesAnteriores ?? [];
  if (versiones.length === 0) return null;
  return (
    <section aria-labelledby="titulo-versiones" className="flex flex-col gap-2">
      <h2 id="titulo-versiones" className="m-0 text-[22px]">
        {D.versiones}
      </h2>
      {versiones.map((v) => (
        <details key={v.numeroVersion} className="rounded-md border border-divisor px-3 py-2">
          <summary className="min-h-[44px] cursor-pointer content-center text-sm font-medium">
            {[
              D.version(v.numeroVersion ?? 1, v.reemplazadaEn ? formatearFechaHora(v.reemplazadaEn) : "—"),
              v.reemplazadaPor ? D.versionPor(v.reemplazadaPor) : null,
              v.total ? D.versionTotal(formatearDineroDe(v.total)) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </summary>
          <div className="flex flex-col gap-2 pt-2 text-sm">
            {v.descripcion && <p className="m-0 whitespace-pre-line">{v.descripcion}</p>}
            <Tabla
              etiqueta={D.version(v.numeroVersion ?? 1, "")}
              columnas={[D.columnas.producto, D.columnas.cantidad, D.columnas.precio, D.columnas.subtotal]}
            >
              {(v.lineas ?? []).map((l) => (
                <tr key={l.productoId} className="border-b border-tinta/8">
                  <Celda>{l.descripcion}</Celda>
                  <Celda derecha>
                    {l.cantidad ? formatearCantidad(l.cantidad) : ""} {l.unidad}
                  </Celda>
                  <Celda derecha>{l.precioUnitario ? formatearDineroDe(l.precioUnitario) : "—"}</Celda>
                  <Celda derecha>{l.subtotal ? formatearDineroDe(l.subtotal) : "—"}</Celda>
                </tr>
              ))}
            </Tabla>
            <div className="flex flex-wrap justify-end gap-x-6 text-xs text-neutro-700">
              {v.manoDeObra && compararDecimales(v.manoDeObra.monto ?? "0", "0") > 0 && (
                <span>
                  {D.manoDeObra}: {formatearDineroDe(v.manoDeObra)}
                </span>
              )}
              {v.descuento && compararDecimales(v.descuento.monto ?? "0", "0") > 0 && (
                <span>
                  {D.descuento}: {formatearDineroDe(v.descuento)}
                </span>
              )}
              {v.vence && <span>{TEXTOS_COTIZACIONES.nueva.vence(formatearFecha(v.vence))}</span>}
            </div>
          </div>
        </details>
      ))}
    </section>
  );
}

/** Detalle de la cotización (RF-87 a RF-96): datos, ítems, cobro, estados, versiones y acciones. */
export function Component() {
  const id = Number(useParams().id);
  const clienteConsultas = useQueryClient();
  const opciones = $api.queryOptions("get", "/api/v1/cotizaciones/{id}", { params: { path: { id } } });
  const consulta = $api.useQuery("get", "/api/v1/cotizaciones/{id}", { params: { path: { id } } });
  const error = errorDeConsultas(consulta);
  if (error) return <EstadoError error={error} alReintentar={() => void consulta.refetch()} />;
  const c = consulta.data;
  if (!c) return <CargandoLista filas={4} />;
  const moneda = c.moneda ?? "USD";
  const resumen = c.resumen;
  const instalacion = c.tipo === "INSTALACION";
  const documento = c.documentoGenerado;

  const actualizar = async (nueva: Cotizacion | undefined) => {
    if (nueva) clienteConsultas.setQueryData(opciones.queryKey, nueva);
    else await consulta.refetch();
    // El listado y el historial del cliente se vuelven a pedir al abrirlos.
    await clienteConsultas.invalidateQueries({
      predicate: (q) => q.queryKey[1] !== "/api/v1/cotizaciones/{id}",
      refetchType: "none",
    });
  };

  return (
    <>
      <EncabezadoPagina
        volver={{ a: "/cotizaciones", etiqueta: D.volver }}
        antetitulo={[
          c.tipo ? TEXTOS_COTIZACIONES.tipos[c.tipo] : null,
          c.fecha ? formatearFecha(c.fecha) : null,
          moneda,
        ]
          .filter(Boolean)
          .join(" · ")}
        titulo={D.titulo(c.consecutivo ?? "")}
        subtitulo={c.cliente?.nombre}
      />
      <div className="flex flex-wrap items-center gap-3">
        <EstadoCotizacion estado={c.estado} />
        {c.porVencer && typeof c.diasParaVencer === "number" && (
          <strong className="text-sm text-acento-700">
            {D.porVencer(TEXTOS_COTIZACIONES.listado.dias(c.diasParaVencer))}
          </strong>
        )}
      </div>
      <AccionesCotizacion
        cotizacion={c}
        alCambiar={actualizar}
        alDesactualizada={async () => {
          await actualizar(undefined);
        }}
      />
      {documento?.id !== undefined && (
        <Alerta tono="info">
          <Link to={`/${documento.tipo === "VENTA" ? "ventas" : "instalaciones"}/${String(documento.id)}`}>
            {D.documento(D.tiposDocumento[documento.tipo ?? ""] ?? "", documento.consecutivo ?? "")}
          </Link>
        </Alerta>
      )}
      <Tarjeta>
        <dl className="m-0 grid gap-4 escritorio:grid-cols-3">
          <Dato titulo={D.cliente}>
            {c.cliente?.id === undefined ? (
              c.cliente?.nombre
            ) : (
              <Link to={`/clientes/${String(c.cliente.id)}`}>{c.cliente.nombre}</Link>
            )}
          </Dato>
          <Dato titulo={D.tipo}>{c.tipo ? TEXTOS_COTIZACIONES.tipos[c.tipo] : "—"}</Dato>
          <Dato titulo={D.validez}>
            {c.validezDias !== undefined && c.vence
              ? D.validezTexto(c.validezDias, formatearFecha(c.vence))
              : "—"}
          </Dato>
          <Dato titulo={D.tasas}>
            {[
              c.tasas?.trm ? `TRM ${formatearDecimal(c.tasas.trm)}` : null,
              c.tasas?.tasaVes ? `Bs ${formatearDecimal(c.tasas.tasaVes)}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </Dato>
          <Dato titulo={D.registrada}>
            {[c.registradaPor, c.registradaEn ? formatearFechaHora(c.registradaEn) : null]
              .filter(Boolean)
              .join(" · ")}
          </Dato>
        </dl>
        {instalacion && c.descripcion && (
          <dl className="m-0">
            <Dato titulo={D.descripcion}>
              <span className="whitespace-pre-line">{c.descripcion}</span>
            </Dato>
          </dl>
        )}
      </Tarjeta>

      {(c.lineas ?? []).length > 0 && (
        <section aria-labelledby="titulo-items" className="flex flex-col gap-2">
          <h2 id="titulo-items" className="m-0 text-[22px]">
            {D.items}
          </h2>
          <Tabla etiqueta={D.items} columnas={Object.values(D.columnas)}>
            {(c.lineas ?? []).map((l) => (
              <tr key={l.productoId} className="border-b border-tinta/8 align-top">
                <Celda>
                  <span className="font-medium">{l.descripcion}</span>
                  <span className="block text-xs text-neutro-700">{l.codigo}</span>
                </Celda>
                <Celda derecha>
                  {l.cantidad ? formatearCantidad(l.cantidad) : ""} {l.unidad}
                </Celda>
                <Celda derecha>
                  {l.precioUnitario ? formatearDineroDe(l.precioUnitario) : "—"}
                  {l.precioSugerido && l.precioSugerido.monto !== l.precioUnitario?.monto && (
                    <span className="block text-xs text-neutro-700">
                      {D.sugerido(formatearDineroDe(l.precioSugerido))}
                    </span>
                  )}
                </Celda>
                <Celda derecha>{l.subtotal ? formatearDineroDe(l.subtotal) : "—"}</Celda>
                <Celda derecha>{l.costoUnitarioUsd ? formatearDineroDe(l.costoUnitarioUsd) : "—"}</Celda>
              </tr>
            ))}
          </Tabla>
        </section>
      )}

      <Tarjeta aria-label={D.resumen} role="region" className="gap-2 escritorio:ml-auto escritorio:w-[420px]">
        {instalacion && (
          <>
            <FilaResumen titulo={D.material} montos={resumen?.material} moneda={moneda} />
            <FilaResumen titulo={D.manoDeObra} montos={resumen?.manoDeObra} moneda={moneda} />
          </>
        )}
        <FilaResumen titulo={D.subtotal} montos={resumen?.subtotal} moneda={moneda} />
        {positivo(resumen?.descuento) && (
          <FilaResumen
            titulo={
              c.descuentoTipo === "PORCENTAJE" && c.descuentoValor
                ? D.descuentoPorcentaje(formatearDecimal(c.descuentoValor))
                : D.descuento
            }
            montos={resumen?.descuento}
            moneda={moneda}
          />
        )}
        <FilaResumen titulo={D.total} montos={resumen?.total} moneda={moneda} fuerte />
        <FilaResumen titulo={D.costo} montos={resumen?.costo} moneda={moneda} />
        <FilaResumen
          titulo={`${D.utilidad}${c.porcentajeUtilidad ? ` · ${formatearDecimal(c.porcentajeUtilidad)} %` : ""}`}
          montos={resumen?.utilidad}
          moneda={moneda}
        />
        {c.observaciones && (
          <p className="m-0 border-t border-divisor pt-2 text-sm">
            <span className="text-neutro-700">{D.observaciones}: </span>
            {c.observaciones}
          </p>
        )}
      </Tarjeta>

      <Historial c={c} />
      <Versiones c={c} />
    </>
  );
}
