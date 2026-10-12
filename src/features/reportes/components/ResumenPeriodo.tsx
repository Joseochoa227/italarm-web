import type { components } from "@/api/esquema";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { TEXTOS_COTIZACIONES } from "@/features/cotizaciones/textos";
import { formatearCantidad, formatearDecimal, formatearDineroDe } from "@/lib/formato";

import { TEXTOS_REPORTES } from "../textos";
import { BarrasHorizontales, GraficoSerie, LeyendaSerie } from "./Graficos";
import { Indicadores } from "./Indicadores";
import { ListaStockBajo } from "./StockBajo";

const R = TEXTOS_REPORTES.resumen;
type Reporte = components["schemas"]["ReportePeriodoVista"];
type Top = components["schemas"]["ReportePeriodoVistaProductoTop"];

function Seccion({
  id,
  titulo,
  acciones,
  children,
}: {
  id: string;
  titulo: string;
  acciones?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Tarjeta role="region" aria-labelledby={id} className="gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <h2 id={id} className="m-0 flex-1 text-[22px]">
          {titulo}
        </h2>
        {acciones}
      </div>
      {children}
    </Tarjeta>
  );
}

const filasTop = (productos: Top[] | undefined) =>
  (productos ?? []).map((p) => ({
    clave: String(p.productoId),
    nombre: p.nombre ?? "",
    valor: p.valor?.monto ?? "0",
    detalle: [
      p.cantidad ? `${formatearCantidad(p.cantidad)}${p.unidad ? ` ${p.unidad}` : ""}` : null,
      p.valor ? formatearDineroDe(p.valor) : null,
    ]
      .filter(Boolean)
      .join(" · "),
  }));

/**
 * Resumen del período (RF-136 a RF-140, RF-142): indicadores, gráfico de ventas e instalaciones,
 * más vendidos e instalados, compras por proveedor, stock bajo y cotizaciones por estado.
 */
export function ResumenPeriodo({ reporte }: { reporte: Reporte }) {
  const cotizaciones = reporte.cotizaciones;
  return (
    <div className="flex flex-col gap-6">
      <section aria-label={R.indicadores}>
        <Indicadores
          indicadores={reporte.indicadores}
          etiquetas={{
            ventas: R.ventas,
            instalaciones: R.instalaciones,
            utilidad: R.utilidad,
            inventario: R.inventario,
          }}
        />
      </section>
      <Seccion id="titulo-grafico" titulo={R.grafico} acciones={<LeyendaSerie />}>
        <GraficoSerie serie={reporte.serie ?? []} />
      </Seccion>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-6">
        <Seccion id="titulo-vendidos" titulo={R.masVendidos}>
          <BarrasHorizontales
            etiqueta={R.masVendidos}
            filas={filasTop(reporte.masVendidos)}
            vacio={R.sinProductos}
          />
        </Seccion>
        <Seccion id="titulo-instalados" titulo={R.masInstalados}>
          <BarrasHorizontales
            etiqueta={R.masInstalados}
            filas={filasTop(reporte.masInstalados)}
            vacio={R.sinProductos}
          />
        </Seccion>
        <Seccion id="titulo-compras" titulo={R.compras}>
          <BarrasHorizontales
            etiqueta={R.compras}
            oscuro
            filas={(reporte.comprasPorProveedor ?? []).map((c) => ({
              clave: String(c.proveedorId),
              nombre: c.proveedor ?? "",
              valor: c.total?.monto ?? "0",
              detalle: [c.total ? formatearDineroDe(c.total) : null, R.comprasDe(c.compras ?? 0)]
                .filter(Boolean)
                .join(" · "),
            }))}
            vacio={R.sinCompras}
          />
          {reporte.totalCompras && (reporte.comprasPorProveedor ?? []).length > 0 && (
            <p className="m-0 border-t border-divisor pt-3 text-sm font-medium">
              {R.totalCompras(formatearDineroDe(reporte.totalCompras))}
            </p>
          )}
        </Seccion>
        <Seccion id="titulo-cotizaciones" titulo={R.cotizaciones}>
          {(cotizaciones?.total ?? 0) === 0 ? (
            <p className="m-0 text-sm text-neutro-700">{R.sinCotizaciones}</p>
          ) : (
            <>
              <p className="m-0 font-titulo text-[28px] leading-tight font-semibold">
                {R.aprobadas(formatearDecimal(cotizaciones?.porcentajeAprobadas ?? "0"))}
              </p>
              <p className="m-0 text-xs text-neutro-700">{R.totalCotizaciones(cotizaciones?.total ?? 0)}</p>
              <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {(cotizaciones?.porEstado ?? []).map((e) => (
                  <div key={e.estado} className="flex justify-between gap-2">
                    <dt className="text-neutro-700">
                      {TEXTOS_COTIZACIONES.estados[e.estado ?? ""] ?? e.estado}
                    </dt>
                    <dd className="m-0 font-medium">{e.cantidad ?? 0}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </Seccion>
        <Seccion
          id="titulo-stock"
          titulo={TEXTOS_REPORTES.stock.titulo}
          acciones={
            <EnlaceBoton a="/inventario" variante="fantasma">
              {TEXTOS_REPORTES.stock.verInventario}
            </EnlaceBoton>
          }
        >
          <ListaStockBajo productos={reporte.stockBajo ?? []} />
        </Seccion>
      </div>
    </div>
  );
}
