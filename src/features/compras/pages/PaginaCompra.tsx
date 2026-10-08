import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useParams } from "react-router";

import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { errorDeConsultas } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Celda, Tabla } from "@/components/ui/Tabla";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { TEXTOS_INVENTARIO } from "@/features/inventario/textosInventario";
import { formatearCantidad, formatearDineroDe, formatearFecha, formatearFechaHora } from "@/lib/formato";

import { AnularCompra } from "../components/AnularCompra";
import { FacturaCompra } from "../components/FacturaCompra";
import { textoTasas } from "../formato";
import { TEXTOS_COMPRAS } from "../textos";

const D = TEXTOS_COMPRAS.detalle;
type Compra = components["schemas"]["CompraVista"];

function Dato({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-neutro-700">{titulo}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}

/** Detalle de la compra (RF-48): datos, líneas con cambio de costo y seriales, factura y anulación. */
export function Component() {
  const id = Number(useParams().id);
  const clienteConsultas = useQueryClient();
  const opciones = $api.queryOptions("get", "/api/v1/compras/{id}", { params: { path: { id } } });
  const consulta = $api.useQuery("get", "/api/v1/compras/{id}", { params: { path: { id } } });
  const error = errorDeConsultas(consulta);
  if (error) return <EstadoError error={error} alReintentar={() => void consulta.refetch()} />;
  const c = consulta.data;
  if (!c) return <CargandoLista filas={4} />;
  const anulada = c.estado === "ANULADA";

  const actualizar = async (nueva: Compra | undefined) => {
    if (nueva) clienteConsultas.setQueryData(opciones.queryKey, nueva);
    // La anulación mueve el inventario y los totales: lo demás se vuelve a pedir al abrirlo.
    await clienteConsultas.invalidateQueries({
      predicate: (q) => q.queryKey[1] !== "/api/v1/compras/{id}",
      refetchType: "none",
    });
  };

  return (
    <>
      <EncabezadoPagina
        volver={{ a: "/compras", etiqueta: D.volver }}
        antetitulo={[c.fecha ? formatearFecha(c.fecha) : null, c.moneda].filter(Boolean).join(" · ")}
        titulo={D.titulo(c.consecutivo ?? "")}
        subtitulo={c.proveedor?.nombre}
        acciones={!anulada && <AnularCompra compra={c} alAnular={actualizar} />}
      />
      {anulada && (
        <Alerta tono="peligro">
          <span className="flex flex-col">
            <strong>{D.anuladaTitulo}</strong>
            {c.anulacion?.motivo}
            {c.anulacion?.usuario && c.anulacion.fecha && (
              <span className="text-xs">
                {D.anuladaDetalle(c.anulacion.usuario, formatearFechaHora(c.anulacion.fecha))}
              </span>
            )}
          </span>
        </Alerta>
      )}
      <Tarjeta>
        <dl className="m-0 grid gap-4 escritorio:grid-cols-3">
          <Dato titulo={D.proveedor}>{c.proveedor?.nombre}</Dato>
          <Dato titulo={D.factura}>{c.numeroFactura}</Dato>
          <Dato titulo={D.fecha}>{c.fecha ? formatearFecha(c.fecha) : "—"}</Dato>
          <Dato titulo={D.moneda}>{c.moneda}</Dato>
          <Dato titulo={D.tasas}>{textoTasas(c.tasas)}</Dato>
          <Dato titulo={D.registrada}>
            {[c.registradaPor, c.registradaEn ? formatearFechaHora(c.registradaEn) : null]
              .filter(Boolean)
              .join(" · ")}
          </Dato>
        </dl>
      </Tarjeta>

      <section aria-labelledby="titulo-productos" className="flex flex-col gap-2">
        <h2 id="titulo-productos" className="m-0 text-[22px]">
          {D.productos}
        </h2>
        <Tabla etiqueta={D.productos} columnas={Object.values(D.columnas)}>
          {(c.lineas ?? []).map((l) => (
            <tr key={l.productoId} className="border-b border-tinta/8 align-top">
              <Celda>
                <span className="font-medium">{l.nombre}</span>
                <span className="block text-xs text-neutro-700">{l.codigo}</span>
                {(l.seriales ?? []).length > 0 && (
                  <span className="block font-mono text-xs text-neutro-700">
                    {D.seriales}: {(l.seriales ?? []).join(", ")}
                  </span>
                )}
              </Celda>
              <Celda derecha>
                {l.cantidad ? formatearCantidad(l.cantidad) : ""} {l.abreviatura}
              </Celda>
              <Celda derecha>
                {l.costoUnitario ? formatearDineroDe(l.costoUnitario) : "—"}
                {l.costoUnitarioUsd && c.moneda !== "USD" && (
                  <span className="block text-xs text-neutro-700">
                    {formatearDineroDe(l.costoUnitarioUsd)}
                  </span>
                )}
              </Celda>
              <Celda derecha>{l.subtotal ? formatearDineroDe(l.subtotal) : "—"}</Celda>
              <Celda derecha>
                {[l.costoAnteriorUsd, l.costoNuevoUsd]
                  .flatMap((d) => (d ? [formatearDineroDe(d)] : []))
                  .join(" → ") || "—"}
              </Celda>
              <Celda>
                {l.regla ? <Etiqueta>{TEXTOS_INVENTARIO.reglas[l.regla] ?? l.regla}</Etiqueta> : null}
              </Celda>
            </tr>
          ))}
        </Tabla>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs text-neutro-700">{D.total}</span>
          <span className="font-titulo text-[28px] font-semibold">
            {c.total ? formatearDineroDe(c.total) : "—"}
          </span>
          {c.totalUsd && c.moneda !== "USD" && (
            <span className="text-sm text-acento-700">{D.equivalente(formatearDineroDe(c.totalUsd))}</span>
          )}
        </div>
      </section>

      <FacturaCompra compra={c} alCambiar={actualizar} />
    </>
  );
}
