import type { ReactNode } from "react";
import { Link, useParams } from "react-router";

import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { formatearCantidad, formatearDineroDe, formatearFecha, formatearFechaHora } from "@/lib/formato";

import { TEXTOS_INVENTARIO } from "../textosInventario";

const D = TEXTOS_INVENTARIO.detalleAjuste;

function Dato({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-neutro-700">{titulo}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}

/** Detalle de un ajuste (RF-58). No se edita ni se anula: se corrige con otro ajuste (P-24). */
export function Component() {
  const id = Number(useParams().id);
  const consulta = $api.useQuery("get", "/api/v1/ajustes/{id}", { params: { path: { id } } });
  const error = errorDeConsultas(consulta);
  if (error) return <EstadoError error={error} alReintentar={() => void consulta.refetch()} />;
  const a = consulta.data;
  if (!a) return <CargandoLista filas={3} />;
  const seriales = a.seriales ?? [];

  return (
    <>
      <EncabezadoPagina
        volver={{ a: "/inventario/ajustes", etiqueta: D.volver }}
        antetitulo={a.fecha ? formatearFecha(a.fecha) : undefined}
        titulo={D.titulo(a.consecutivo ?? "")}
        subtitulo={a.producto?.nombre}
      />
      <Tarjeta>
        <dl className="m-0 grid gap-4 escritorio:grid-cols-3">
          <Dato titulo={D.producto}>
            {a.producto?.id !== undefined ? (
              <Link to={`/inventario/productos/${String(a.producto.id)}`}>
                {[a.producto.codigo, a.producto.nombre].filter(Boolean).join(" · ")}
              </Link>
            ) : (
              "—"
            )}
          </Dato>
          <Dato titulo={D.tipo}>{(a.tipo && TEXTOS_INVENTARIO.ajustes.tipos[a.tipo]) ?? a.tipo}</Dato>
          <Dato titulo={D.motivo}>{a.motivoEtiqueta ?? a.motivo}</Dato>
          <Dato titulo={D.cantidad}>
            {a.cantidad ? formatearCantidad(a.cantidad) : "—"} {a.abreviatura}
          </Dato>
          <Dato titulo={D.costo}>{a.costoUnitarioUsd ? formatearDineroDe(a.costoUnitarioUsd) : "—"}</Dato>
          <Dato titulo={D.valor}>{a.valorUsd ? formatearDineroDe(a.valorUsd) : "—"}</Dato>
          {a.descripcion && <Dato titulo={D.descripcion}>{a.descripcion}</Dato>}
          <Dato titulo={D.registrado}>
            {[a.registradoPor, a.registradoEn ? formatearFechaHora(a.registradoEn) : null]
              .filter(Boolean)
              .join(" · ")}
          </Dato>
          {seriales.length > 0 && (
            <Dato titulo={D.seriales}>
              <span className="font-mono text-sm">{seriales.join(", ")}</span>
            </Dato>
          )}
        </dl>
      </Tarjeta>
      <Alerta tono="info">{TEXTOS_INVENTARIO.ajuste.noSeAnula}</Alerta>
    </>
  );
}
