import { Pencil, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";

import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { EstadoError } from "@/components/ui/EstadoError";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Paginacion } from "@/components/ui/Paginacion";
import { Celda, Tabla } from "@/components/ui/Tabla";
import { Tarjeta } from "@/components/ui/Tarjeta";
import {
  formatearCantidad,
  formatearDecimal,
  formatearDineroDe,
  formatearEnMonedas,
  formatearFecha,
} from "@/lib/formato";

import { EnlaceDocumento } from "../components/EnlaceDocumento";
import { SerialesProducto } from "../components/SerialesProducto";
import { TEXTOS_PRODUCTOS } from "../textos";
import { TEXTOS_INVENTARIO } from "../textosInventario";

const D = TEXTOS_INVENTARIO.detalle;
const REGLAS = TEXTOS_INVENTARIO.reglas;

function Indicador({
  titulo,
  principal,
  detalle,
}: {
  titulo: string;
  principal: string;
  detalle?: string | undefined;
}) {
  return (
    <Tarjeta>
      <span className="rotulo text-acento-700">{titulo}</span>
      <span className="font-titulo text-[26px] leading-none font-semibold">{principal}</span>
      {detalle && <span className="text-xs text-neutro-700">{detalle}</span>}
    </Tarjeta>
  );
}

/** El primer monto (USD) en grande y los equivalentes debajo. */
function enMonedas(montos: Parameters<typeof formatearEnMonedas>[0]) {
  const [principal = "—", ...resto] = formatearEnMonedas(montos).split(" · ");
  return { principal, detalle: resto.join(" · ") || undefined };
}

/** Detalle del producto (RF-53 a RF-57): indicadores, seriales, kárdex e historial de costo. */
export function Component() {
  const id = Number(useParams().id);
  const [paginaKardex, setPaginaKardex] = useState(1);
  const producto = $api.useQuery("get", "/api/v1/inventario/productos/{id}", { params: { path: { id } } });
  const kardex = $api.useQuery("get", "/api/v1/inventario/productos/{id}/kardex", {
    params: { path: { id }, query: { page: paginaKardex - 1, size: 20 } },
  });
  const costos = $api.useQuery("get", "/api/v1/inventario/productos/{id}/historial-costo", {
    params: { path: { id } },
  });

  const error = errorDeConsultas(producto);
  if (error) return <EstadoError error={error} alReintentar={() => void producto.refetch()} />;
  const p = producto.data;
  if (!p) return <CargandoLista filas={4} />;
  const unidad = p.abreviatura ?? "";
  const movimientos = kardex.data?.contenido ?? [];
  const cambios = costos.data ?? [];
  const errorKardex = errorDeConsultas(kardex);
  const errorCostos = errorDeConsultas(costos);

  return (
    <>
      <EncabezadoPagina
        antetitulo={[p.codigo, p.categoria].filter(Boolean).join(" · ")}
        titulo={p.nombre ?? ""}
        subtitulo={[p.marca, p.modelo, D.unidad(unidad)].filter(Boolean).join(" · ")}
        volver={{ a: "/inventario", etiqueta: D.volver }}
        acciones={
          <>
            <EnlaceBoton
              a={`/inventario/productos/${String(id)}/editar`}
              icono={<Pencil aria-hidden size={16} />}
            >
              {D.editar}
            </EnlaceBoton>
            <EnlaceBoton
              a={`/inventario/productos/${String(id)}/ajuste`}
              variante="primario"
              icono={<SlidersHorizontal aria-hidden size={16} />}
            >
              {D.ajustar}
            </EnlaceBoton>
          </>
        }
      />
      {p.activo === false && <Alerta tono="aviso">{D.inactivo}</Alerta>}
      {(p.avisos ?? []).map((a) => (
        <Alerta key={a} tono="aviso">
          {a}
        </Alerta>
      ))}

      <div className="grid gap-4 escritorio:grid-cols-3">
        <Indicador
          titulo={D.stock}
          principal={`${formatearCantidad(p.stock ?? "0")} ${unidad}`}
          detalle={
            [
              p.stockMinimo ? D.minimo(`${formatearCantidad(p.stockMinimo)} ${unidad}`) : null,
              p.bajoMinimo ? TEXTOS_PRODUCTOS.bajo : null,
            ]
              .filter(Boolean)
              .join(" · ") || undefined
          }
        />
        <Indicador
          titulo={D.costo}
          {...(p.costoActual ? enMonedas(p.costoActual) : { principal: D.sinCosto })}
        />
        <Indicador titulo={D.valor} {...enMonedas(p.valorEnBodega)} />
        <Indicador titulo={D.precioInstalador} {...enMonedas(p.precioInstalador)} />
        <Indicador titulo={D.precioClienteFinal} {...enMonedas(p.precioClienteFinal)} />
      </div>

      {p.controlaSerial && <SerialesProducto productoId={id} resumen={p.seriales} />}

      <section aria-labelledby="titulo-kardex" className="flex flex-col gap-2">
        <h2 id="titulo-kardex" className="m-0 text-[22px]">
          {D.kardex}
          {kardex.data?.totalElementos !== undefined && (
            <span className="ml-2 font-texto text-sm font-normal text-neutro-700">
              · {kardex.data.totalElementos}
            </span>
          )}
        </h2>
        {errorKardex ? (
          <EstadoError error={errorKardex} alReintentar={() => void kardex.refetch()} />
        ) : kardex.isPending ? (
          <CargandoLista filas={3} />
        ) : movimientos.length === 0 ? (
          <p className="m-0 text-sm text-neutro-700">{D.sinMovimientos}</p>
        ) : (
          <>
            <Tabla etiqueta={D.kardex} columnas={Object.values(D.columnas)}>
              {movimientos.map((m) => (
                <tr key={m.id} className="border-b border-tinta/8">
                  <Celda>{m.fecha ? formatearFecha(m.fecha) : ""}</Celda>
                  <Celda>
                    {m.tipoEtiqueta ?? m.tipo}
                    {m.detalle && <span className="block text-xs text-neutro-700">{m.detalle}</span>}
                  </Celda>
                  <Celda>
                    <EnlaceDocumento documento={m.documento} />
                  </Celda>
                  <Celda derecha>{m.entrada ? formatearCantidad(m.entrada) : ""}</Celda>
                  <Celda derecha>{m.salida ? formatearCantidad(m.salida) : ""}</Celda>
                  <Celda derecha>
                    <strong>{m.saldo ? formatearCantidad(m.saldo) : ""}</strong>
                  </Celda>
                  <Celda>{m.usuario}</Celda>
                </tr>
              ))}
            </Tabla>
            <Paginacion
              pagina={paginaKardex}
              totalPaginas={kardex.data?.totalPaginas ?? 1}
              alCambiar={setPaginaKardex}
            />
          </>
        )}
      </section>

      <section aria-labelledby="titulo-costo" className="flex flex-col gap-2">
        <h2 id="titulo-costo" className="m-0 text-[22px]">
          {D.historialCosto}
        </h2>
        <p className="m-0 text-sm text-neutro-700">{D.historialCostoNota}</p>
        {errorCostos ? (
          <EstadoError error={errorCostos} alReintentar={() => void costos.refetch()} />
        ) : costos.isPending ? (
          <CargandoLista filas={2} />
        ) : cambios.length === 0 ? (
          <p className="m-0 text-sm text-neutro-700">{D.sinCambiosCosto}</p>
        ) : (
          <Tabla etiqueta={D.historialCosto} columnas={Object.values(D.columnasCosto)}>
            {cambios.map((c) => (
              <tr key={c.id} className="border-b border-tinta/8">
                <Celda>{c.fecha ? formatearFecha(c.fecha) : ""}</Celda>
                <Celda>
                  <EnlaceDocumento documento={c.documento} />
                </Celda>
                <Celda derecha>{c.costoFactura ? formatearDineroDe(c.costoFactura) : "—"}</Celda>
                <Celda derecha>{c.tasaFactura ? formatearDecimal(c.tasaFactura) : "—"}</Celda>
                <Celda derecha>{c.costoAnteriorUsd ? formatearDineroDe(c.costoAnteriorUsd) : "—"}</Celda>
                <Celda derecha>
                  <strong>{c.costoNuevoUsd ? formatearDineroDe(c.costoNuevoUsd) : "—"}</strong>
                </Celda>
                <Celda>
                  {c.regla ? <Etiqueta tono="acento">{REGLAS[c.regla] ?? c.regla}</Etiqueta> : null}
                </Celda>
              </tr>
            ))}
          </Tabla>
        )}
      </section>
    </>
  );
}
