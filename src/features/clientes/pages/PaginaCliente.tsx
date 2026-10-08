import { FileText, MessageCircle, Pencil, ShoppingCart, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";

import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { cx } from "@/lib/clases";
import { formatearDineroDe, formatearFecha } from "@/lib/formato";

import { enlaceWhatsapp } from "../hooks/clientes";
import { TEXTOS_CLIENTES } from "../textos";

const T = TEXTOS_CLIENTES;
const D = T.detalle;

const CLASE_ACCION =
  "border-divisor text-tinta hover:bg-tinta/7 hover:text-tinta font-titulo inline-flex min-h-[44px] items-center gap-1.5 rounded-md border px-4 text-[15px] font-semibold no-underline";

function Accion({
  a,
  icono,
  children,
  externo = false,
}: {
  a: string;
  icono: ReactNode;
  children: ReactNode;
  externo?: boolean;
}) {
  return externo ? (
    <a
      href={a}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        CLASE_ACCION,
        "border-acento-700 bg-acento-700 text-fondo hover:bg-acento-800 hover:text-fondo",
      )}
    >
      {icono}
      {children}
    </a>
  ) : (
    <Link to={a} className={CLASE_ACCION}>
      {icono}
      {children}
    </Link>
  );
}

/** Detalle del cliente (RF-77): contacto, WhatsApp, accesos a documentos e historial. */
export function Component() {
  const id = Number(useParams().id);
  const cliente = $api.useQuery("get", "/api/v1/clientes/{id}", { params: { path: { id } } });
  const historial = $api.useQuery("get", "/api/v1/clientes/{id}/historial", { params: { path: { id } } });
  const error = errorDeConsultas(cliente);
  if (error) return <EstadoError error={error} alReintentar={() => void cliente.refetch()} />;
  const c = cliente.data;
  if (!c) return <CargandoLista filas={4} />;

  const whatsapp = enlaceWhatsapp(c.telefono);
  const movimientos = historial.data?.movimientos ?? [];
  const errorHistorial = errorDeConsultas(historial);
  const conCliente = `?clienteId=${String(id)}`;

  return (
    <>
      <EncabezadoPagina
        antetitulo={c.tipo ? T.tipos[c.tipo] : undefined}
        titulo={c.nombre ?? ""}
        subtitulo={[
          c.tipoDocumento && c.numeroDocumento
            ? `${c.tipoDocumento} ${c.numeroDocumento}`
            : c.numeroDocumento,
          c.direccion,
          c.ciudad,
          c.correo,
        ]
          .filter(Boolean)
          .join(" · ")}
        volver={{ a: "/clientes", etiqueta: T.titulo }}
      />
      <div className="flex flex-wrap gap-2">
        {whatsapp && (
          <Accion a={whatsapp} externo icono={<MessageCircle aria-hidden size={16} />}>
            {D.whatsapp} {c.telefono}
          </Accion>
        )}
        <Accion a={`/ventas/nueva${conCliente}`} icono={<ShoppingCart aria-hidden size={16} />}>
          {D.venta}
        </Accion>
        <Accion a={`/instalaciones/nueva${conCliente}`} icono={<Wrench aria-hidden size={16} />}>
          {D.instalacion}
        </Accion>
        <Accion a={`/cotizaciones/nueva${conCliente}`} icono={<FileText aria-hidden size={16} />}>
          {D.cotizacion}
        </Accion>
        <Accion a={`/clientes/${String(id)}/editar`} icono={<Pencil aria-hidden size={16} />}>
          {D.editar}
        </Accion>
      </div>
      <div className="grid gap-4 escritorio:grid-cols-3">
        <Tarjeta>
          <span className="rotulo text-acento-700">{D.precio}</span>
          <span className="text-sm">
            {c.precioAplicadoDescripcion ?? (c.tipo ? T.precioAplicado[c.tipo] : "—")}
          </span>
        </Tarjeta>
        <Tarjeta>
          <span className="rotulo text-acento-700">{D.compras}</span>
          <span className="font-titulo text-[28px] leading-none font-semibold">
            {historial.data?.compras ?? "—"}
          </span>
        </Tarjeta>
        <Tarjeta>
          <span className="rotulo text-acento-700">{D.instalaciones}</span>
          <span className="font-titulo text-[28px] leading-none font-semibold">
            {historial.data?.instalaciones ?? "—"}
          </span>
        </Tarjeta>
      </div>
      <section aria-labelledby="titulo-historial" className="flex flex-col gap-2">
        <h2 id="titulo-historial" className="m-0 text-[22px]">
          {D.historial}
        </h2>
        {errorHistorial ? (
          <EstadoError error={errorHistorial} alReintentar={() => void historial.refetch()} />
        ) : historial.isPending ? (
          <CargandoLista filas={3} />
        ) : movimientos.length === 0 ? (
          <p className="m-0 text-sm text-neutro-700">{D.sinHistorial}</p>
        ) : (
          <ul aria-label={D.historial} className="m-0 list-none border-t border-divisor p-0">
            {movimientos.map((m, i) => (
              <li
                key={`${m.tipo ?? ""}-${String(m.id ?? i)}`}
                className={cx(
                  "flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-divisor py-3 text-sm",
                  m.estado === "ANULADA" && "opacity-70",
                )}
              >
                <span className="min-w-[90px] font-medium">{m.consecutivo}</span>
                <span className="min-w-[200px] flex-1">
                  {m.tipo ? (D.tiposDocumento[m.tipo] ?? m.tipo) : ""}
                  {m.descripcion ? ` · ${m.descripcion}` : ""}
                </span>
                <span className="text-neutro-700">{m.fecha ? formatearFecha(m.fecha) : ""}</span>
                <span className="font-medium">
                  {m.total?.monto && m.total.moneda
                    ? formatearDineroDe({ monto: m.total.monto, moneda: m.total.moneda })
                    : ""}
                </span>
                {m.estado === "ANULADA" && <Etiqueta tono="peligro">{D.anulada}</Etiqueta>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
