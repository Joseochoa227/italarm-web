import type { ReactNode } from "react";
import { useParams } from "react-router";

import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { formatearFecha } from "@/lib/formato";

import { EnlaceDocumento } from "../components/EnlaceDocumento";
import { TEXTOS_INVENTARIO } from "../textosInventario";

const T = TEXTOS_INVENTARIO.serial;

function Dato({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-neutro-700">{titulo}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}

/** Historial de un serial (RF-24): estado, documentos, movimientos y reclamos. */
export function Component() {
  const id = Number(useParams().id);
  const consulta = $api.useQuery("get", "/api/v1/seriales/{id}", { params: { path: { id } } });
  const error = errorDeConsultas(consulta);
  if (error) return <EstadoError error={error} alReintentar={() => void consulta.refetch()} />;
  if (!consulta.data) return <CargandoLista filas={3} />;
  const { serial, movimientos = [], reclamos = [] } = consulta.data;
  const producto = serial?.producto;

  return (
    <>
      <EncabezadoPagina
        antetitulo={producto?.codigo}
        titulo={T.titulo(serial?.numero ?? "")}
        subtitulo={producto?.nombre}
        volver={
          producto?.id === undefined
            ? { a: "/inventario", etiqueta: T.volver }
            : { a: `/inventario/productos/${String(producto.id)}`, etiqueta: producto.nombre ?? T.volver }
        }
      />
      <Tarjeta>
        <dl className="m-0 grid gap-4 escritorio:grid-cols-4">
          <Dato titulo={T.estado}>
            {serial?.estado ? (
              <Etiqueta tono="acento">
                {TEXTOS_INVENTARIO.estadoSerial[serial.estado] ?? serial.estado}
              </Etiqueta>
            ) : (
              "—"
            )}
          </Dato>
          <Dato titulo={T.entrada}>
            <EnlaceDocumento documento={serial?.documentoEntrada} />
            {serial?.fechaEntrada && (
              <span className="text-sm text-neutro-700"> · {formatearFecha(serial.fechaEntrada)}</span>
            )}
          </Dato>
          <Dato titulo={T.salida}>
            <EnlaceDocumento documento={serial?.documentoSalida} />
          </Dato>
          <Dato titulo={T.garantia}>
            {serial?.vencimientoGarantia ? formatearFecha(serial.vencimientoGarantia) : "—"}
          </Dato>
        </dl>
      </Tarjeta>

      <section aria-labelledby="titulo-movimientos" className="flex flex-col gap-2">
        <h2 id="titulo-movimientos" className="m-0 text-[22px]">
          {T.movimientos}
        </h2>
        {movimientos.length === 0 ? (
          <p className="m-0 text-sm text-neutro-700">{T.sinMovimientos}</p>
        ) : (
          <ol aria-label={T.movimientos} className="m-0 flex list-none flex-col p-0">
            {movimientos.map((m, i) => (
              <li
                key={`${m.registradoEn ?? ""}-${String(i)}`}
                className="flex flex-wrap items-baseline gap-x-3 border-b border-divisor py-2.5 text-sm"
              >
                <span className="w-[90px] text-neutro-700">{m.fecha ? formatearFecha(m.fecha) : ""}</span>
                <span className="flex-1 font-medium">
                  {m.tipo ? (T.tipos[m.tipo] ?? m.tipo) : ""}
                  {m.detalle && <span className="block font-normal text-neutro-700">{m.detalle}</span>}
                </span>
                <EnlaceDocumento documento={m.documento} />
                {m.usuario && <span className="text-neutro-700">{m.usuario}</span>}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="titulo-reclamos" className="flex flex-col gap-2">
        <h2 id="titulo-reclamos" className="m-0 text-[22px]">
          {T.reclamos}
        </h2>
        {reclamos.length === 0 ? (
          <p className="m-0 text-sm text-neutro-700">{T.sinReclamos}</p>
        ) : (
          <ul aria-label={T.reclamos} className="m-0 flex list-none flex-col p-0">
            {reclamos.map((r) => (
              <li key={r.id} className="flex flex-col gap-0.5 border-b border-divisor py-2.5 text-sm">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-neutro-700">{r.fecha ? formatearFecha(r.fecha) : ""}</span>
                  {r.enGarantia === false && <Etiqueta tono="peligro">{T.fueraDeGarantia}</Etiqueta>}
                </span>
                <span>{r.problema}</span>
                {r.solucion && <span className="text-neutro-700">{T.solucion(r.solucion)}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
