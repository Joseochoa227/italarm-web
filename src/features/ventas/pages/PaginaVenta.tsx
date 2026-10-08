import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Link, useParams } from "react-router";

import { $api, api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { errorDeConsultas } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { Celda, Tabla } from "@/components/ui/Tabla";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { AccionesComprobante } from "@/features/comercial/components/AccionesComprobante";
import { AnularDocumento } from "@/features/comercial/components/AnularDocumento";
import {
  formatearCantidad,
  formatearDecimal,
  formatearDineroDe,
  formatearFecha,
  formatearFechaHora,
  separarMonedas,
} from "@/lib/formato";

import { comprobanteVenta, enlaceVenta } from "../comprobante";
import { EdicionVenta } from "../components/EdicionVenta";
import { TEXTOS_VENTAS } from "../textos";

const D = TEXTOS_VENTAS.detalle;
type Venta = components["schemas"]["VentaVista"];

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
  moneda: NonNullable<Venta["moneda"]>;
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

/** Detalle de la venta (RF-105, RF-106): lo que se guardó, el comprobante, lo editable y la anulación. */
export function Component() {
  const id = Number(useParams().id);
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const [conflicto, setConflicto] = useState(false);
  const opciones = $api.queryOptions("get", "/api/v1/ventas/{id}", { params: { path: { id } } });
  const consulta = $api.useQuery("get", "/api/v1/ventas/{id}", { params: { path: { id } } });
  const error = errorDeConsultas(consulta);
  if (error) return <EstadoError error={error} alReintentar={() => void consulta.refetch()} />;
  const v = consulta.data;
  if (!v) return <CargandoLista filas={4} />;
  const anulada = v.estado === "ANULADA";
  const moneda = v.moneda ?? "USD";
  const consecutivo = v.consecutivo ?? "";
  const resumen = v.resumen;

  const actualizar = async (nueva: Venta | undefined) => {
    setConflicto(false);
    if (nueva) clienteConsultas.setQueryData(opciones.queryKey, nueva);
    // La anulación mueve el inventario, los seriales y los totales: se vuelven a pedir al abrirlos.
    await clienteConsultas.invalidateQueries({
      predicate: (q) => q.queryKey[1] !== "/api/v1/ventas/{id}",
      refetchType: "none",
    });
  };

  return (
    <>
      <EncabezadoPagina
        volver={{ a: "/ventas", etiqueta: D.volver }}
        antetitulo={[v.fecha ? formatearFecha(v.fecha) : null, moneda].filter(Boolean).join(" · ")}
        titulo={D.titulo(consecutivo)}
        subtitulo={v.cliente?.nombre}
        acciones={
          <>
            <AccionesComprobante
              consecutivo={consecutivo}
              obtenerPdf={() => comprobanteVenta(id, consecutivo)}
              obtenerEnlace={() => enlaceVenta(id)}
            />
            {!anulada && (
              <AnularDocumento
                textos={{
                  anular: D.anular,
                  titulo: D.anularTitulo(consecutivo),
                  texto: D.anularTexto,
                  motivo: D.motivo,
                  motivoRequerido: D.motivoRequerido,
                }}
                alAnular={async (motivo) => {
                  const { data } = await api.POST("/api/v1/ventas/{id}/anular", {
                    params: { path: { id } },
                    body: { motivo },
                  });
                  await actualizar(data);
                  avisar({ titulo: D.anulada(consecutivo) });
                }}
              />
            )}
          </>
        }
      />
      {anulada && (
        <Alerta tono="peligro">
          <span className="flex flex-col">
            <strong>{D.anuladaTitulo}</strong>
            {v.anulacion?.motivo}
            {v.anulacion?.usuario && v.anulacion.fecha && (
              <span className="text-xs">
                {D.anuladaDetalle(v.anulacion.usuario, formatearFechaHora(v.anulacion.fecha))}
              </span>
            )}
          </span>
        </Alerta>
      )}
      <Tarjeta>
        <dl className="m-0 grid gap-4 escritorio:grid-cols-3">
          <Dato titulo={D.cliente}>
            {v.cliente?.id === undefined ? (
              v.cliente?.nombre
            ) : (
              <Link to={`/clientes/${String(v.cliente.id)}`}>{v.cliente.nombre}</Link>
            )}
          </Dato>
          <Dato titulo={D.documento}>{v.cliente?.documento ?? "—"}</Dato>
          <Dato titulo={D.direccion}>
            {[v.cliente?.direccion, v.cliente?.ciudad].filter(Boolean).join(", ") || "—"}
          </Dato>
          <Dato titulo={D.moneda}>{moneda}</Dato>
          <Dato titulo={D.tasas}>
            {[
              v.tasas?.trm ? `TRM ${formatearDecimal(v.tasas.trm)}` : null,
              v.tasas?.tasaVes ? `Bs ${formatearDecimal(v.tasas.tasaVes)}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </Dato>
          <Dato titulo={D.registrada}>
            {[v.registradaPor, v.registradaEn ? formatearFechaHora(v.registradaEn) : null]
              .filter(Boolean)
              .join(" · ")}
          </Dato>
          {v.cotizacion?.consecutivo && <Dato titulo={D.cotizacion}>{v.cotizacion.consecutivo}</Dato>}
        </dl>
      </Tarjeta>

      <section aria-labelledby="titulo-productos" className="flex flex-col gap-2">
        <h2 id="titulo-productos" className="m-0 text-[22px]">
          {D.productos}
        </h2>
        <Tabla etiqueta={D.productos} columnas={Object.values(D.columnas)}>
          {(v.lineas ?? []).map((l) => (
            <tr key={l.productoId} className="border-b border-tinta/8 align-top">
              <Celda>
                <span className="font-medium">{l.descripcion}</span>
                <span className="block text-xs text-neutro-700">{l.codigo}</span>
                {(l.seriales ?? []).map((s) => (
                  <span key={s.id ?? s.numero} className="block text-xs text-neutro-700">
                    <Link to={`/seriales/${String(s.id)}`} className="font-mono">
                      {s.numero}
                    </Link>
                    {s.vencimientoGarantia && ` · ${D.garantia(formatearFecha(s.vencimientoGarantia))}`}
                  </span>
                ))}
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

      <Tarjeta aria-label={D.resumen} role="region" className="gap-2 escritorio:ml-auto escritorio:w-[420px]">
        <FilaResumen titulo={TEXTOS_VENTAS.nueva.subtotal} montos={resumen?.subtotal} moneda={moneda} />
        {v.descuentoTipo && (
          <FilaResumen
            titulo={
              v.descuentoTipo === "PORCENTAJE" && v.descuentoValor
                ? D.descuentoPorcentaje(formatearDecimal(v.descuentoValor))
                : TEXTOS_VENTAS.nueva.descuento
            }
            montos={resumen?.descuento}
            moneda={moneda}
          />
        )}
        <FilaResumen titulo={TEXTOS_VENTAS.nueva.total} montos={resumen?.total} moneda={moneda} fuerte />
        <FilaResumen titulo={TEXTOS_VENTAS.nueva.costoMaterial} montos={resumen?.costo} moneda={moneda} />
        <FilaResumen
          titulo={`${TEXTOS_VENTAS.nueva.utilidad}${v.porcentajeUtilidad ? ` · ${formatearDecimal(v.porcentajeUtilidad)} %` : ""}`}
          montos={resumen?.utilidad}
          moneda={moneda}
        />
      </Tarjeta>

      <EdicionVenta
        key={v.version}
        venta={v}
        conflicto={conflicto}
        alGuardar={actualizar}
        alConflicto={async () => {
          await consulta.refetch();
          setConflicto(true);
        }}
      />
    </>
  );
}
