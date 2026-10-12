import { FileText, ShieldCheck, TriangleAlert } from "lucide-react";
import { Link } from "react-router";

import type { components } from "@/api/esquema";
import { errorDeConsultas } from "@/api/problema";
import { MENU_NUEVO } from "@/app/navegacion";
import { Alerta } from "@/components/ui/Alerta";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { EstadoError } from "@/components/ui/EstadoError";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { useSesion } from "@/features/auth/hooks/contextoSesion";
import { TEXTOS_COTIZACIONES } from "@/features/cotizaciones/textos";
import { Indicadores } from "@/features/reportes/components/Indicadores";
import { ListaStockBajo } from "@/features/reportes/components/StockBajo";
import { TEXTOS_REPORTES } from "@/features/reportes/textos";
import { cx } from "@/lib/clases";
import { rutaDocumento } from "@/lib/documentos";
import { formatearDineroDe, formatearFecha, formatearFechaHora, formatearFechaLarga } from "@/lib/formato";

import { Bloque } from "../components/Bloque";
import { useInicio } from "../hooks/inicio";
import { TEXTOS_INICIO } from "../textos";

const T = TEXTOS_INICIO;
type Inicio = components["schemas"]["InicioVista"];
const TIPOS_DOCUMENTO = ["VENTA", "INSTALACION", "COMPRA", "AJUSTE", "INVENTARIO_INICIAL"] as const;

function Garantias({ inicio }: { inicio: Inicio }) {
  const garantias = inicio.garantiasPorVencer ?? [];
  return (
    <Bloque
      id="titulo-garantias"
      icono={<ShieldCheck aria-hidden size={20} />}
      titulo={T.garantias.titulo}
      resumen={
        garantias.length > 0
          ? T.garantias.total(inicio.totalGarantiasPorVencer ?? garantias.length)
          : undefined
      }
      enlace={{ a: "/garantias?estado=POR_VENCER", etiqueta: T.garantias.verTodas }}
    >
      {garantias.length === 0 ? (
        <p className="m-0 text-sm text-neutro-700">{T.garantias.vacio}</p>
      ) : (
        <ul aria-label={T.garantias.titulo} className="m-0 flex list-none flex-col p-0">
          {garantias.map((g, i) => {
            const ruta = rutaDocumento(g.documento);
            const documento = [g.documento?.consecutivo, g.serial ?? g.producto].filter(Boolean).join(" · ");
            return (
              <li
                key={`${String(g.documento?.id)}-${g.serial ?? String(i)}`}
                className="flex items-center gap-3 border-t border-tinta/8 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{g.cliente}</div>
                  <div className="text-xs text-neutro-700">
                    {ruta ? <Link to={ruta}>{documento}</Link> : documento}
                    {g.vencimiento ? ` · ${T.garantias.vence(formatearFecha(g.vencimiento))}` : ""}
                  </div>
                </div>
                <span className="min-w-[56px] text-right text-xs text-neutro-700">
                  {typeof g.diasRestantes === "number" ? T.garantias.dias(g.diasRestantes) : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Bloque>
  );
}

function Cotizaciones({ inicio }: { inicio: Inicio }) {
  const cotizaciones = inicio.cotizacionesEnEvaluacion ?? [];
  return (
    <Bloque
      id="titulo-cotizaciones"
      icono={<FileText aria-hidden size={20} />}
      titulo={T.cotizaciones.titulo}
      resumen={
        cotizaciones.length > 0
          ? T.cotizaciones.total(inicio.totalCotizacionesEnEvaluacion ?? cotizaciones.length)
          : undefined
      }
      enlace={{ a: "/cotizaciones?estado=EN_EVALUACION", etiqueta: T.cotizaciones.verTodas }}
    >
      {cotizaciones.length === 0 ? (
        <p className="m-0 text-sm text-neutro-700">{T.cotizaciones.vacio}</p>
      ) : (
        <ul aria-label={T.cotizaciones.titulo} className="m-0 flex list-none flex-col p-0">
          {cotizaciones.map((c) => (
            <li key={c.id} className={cx("border-t border-tinta/8", c.porVencer && "bg-acento/7")}>
              <Link
                to={`/cotizaciones/${String(c.id)}`}
                className="flex min-h-[44px] items-center gap-3 px-1 py-3 text-tinta no-underline hover:text-tinta"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{c.cliente}</div>
                  <div className="text-xs text-neutro-700">
                    {[c.consecutivo, c.total ? formatearDineroDe(c.total) : null].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {c.porVencer && <Etiqueta tono="acento">{T.cotizaciones.porVencer}</Etiqueta>}
                <span
                  className={cx(
                    "min-w-[90px] text-right text-xs",
                    c.porVencer ? "font-semibold text-acento-700" : "text-neutro-700",
                  )}
                >
                  {typeof c.diasParaVencer === "number"
                    ? TEXTOS_COTIZACIONES.listado.dias(c.diasParaVencer)
                    : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Bloque>
  );
}

function Movimientos({ inicio }: { inicio: Inicio }) {
  const movimientos = inicio.ultimosMovimientos ?? [];
  return (
    <Bloque id="titulo-movimientos" titulo={T.movimientos.titulo}>
      {movimientos.length === 0 ? (
        <p className="m-0 text-sm text-neutro-700">{T.movimientos.vacio}</p>
      ) : (
        <ul aria-label={T.movimientos.titulo} className="m-0 flex list-none flex-col p-0">
          {movimientos.map((m) => {
            const tipo = TIPOS_DOCUMENTO.find((t) => t === m.tipo);
            const ruta = tipo && m.id !== undefined ? rutaDocumento({ tipo, id: m.id }) : null;
            const contenido = (
              <>
                <span className="w-[120px] flex-none">
                  <Etiqueta>{T.movimientos.tipos[m.tipo ?? ""] ?? m.tipo}</Etiqueta>
                </span>
                <div className="min-w-0 flex-[1_1_220px]">
                  <div className="font-medium">
                    {m.consecutivo}
                    {m.detalle && <span className="font-normal text-neutro-700"> · {m.detalle}</span>}
                  </div>
                  <div className="text-xs text-neutro-700">
                    {[m.usuario, m.registradoEn ? formatearFechaHora(m.registradoEn) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                {m.anulado && <Etiqueta tono="contorno">{T.movimientos.anulado}</Etiqueta>}
                <span
                  className={cx(
                    "font-titulo text-lg font-semibold",
                    m.anulado && "text-neutro-600 line-through",
                  )}
                >
                  {m.valor ? formatearDineroDe(m.valor) : ""}
                </span>
              </>
            );
            const clases = "flex flex-wrap items-center gap-x-4 gap-y-2 py-3";
            return (
              <li key={`${m.tipo ?? ""}-${String(m.id)}`} className="border-t border-tinta/8">
                {ruta ? (
                  <Link to={ruta} className={cx(clases, "text-tinta no-underline hover:text-tinta")}>
                    {contenido}
                  </Link>
                ) : (
                  <div className={clases}>{contenido}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Bloque>
  );
}

/**
 * Inicio (sección 3.2, RF-06 a RF-13): avisos de tasas antes que todo, saludo, indicadores del
 * mes, accesos rápidos, stock bajo, garantías y cotizaciones por vencer y últimos movimientos.
 * Una sola petición (RNF-08).
 */
export function Component() {
  const { usuario } = useSesion();
  const consulta = useInicio();
  const inicio = consulta.data;
  const error = errorDeConsultas(consulta);
  const nombre = usuario?.nombre?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-6">
      {(inicio?.avisosTasas ?? []).map((a) => (
        <Alerta key={a.par ?? a.mensaje} tono="aviso" rol="alert">
          <span className="flex flex-wrap items-center gap-3">
            <span className="flex-1">{a.mensaje}</span>
            <EnlaceBoton a="/tasas" variante="primario">
              {T.registrarTasa}
            </EnlaceBoton>
          </span>
        </Alerta>
      ))}
      <div>
        <p className="m-0 rotulo text-acento-700">{formatearFechaLarga(new Date())}</p>
        <h1 className="m-0 text-[32px] escritorio:text-[40px]">{T.hola(nombre)}</h1>
      </div>

      {error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : !inicio ? (
        <CargandoLista filas={4} />
      ) : (
        <>
          <section aria-label={T.indicadores}>
            <Indicadores
              indicadores={inicio.indicadores}
              etiquetas={{
                ventas: T.ventas,
                instalaciones: T.instalaciones,
                utilidad: T.utilidad,
                inventario: T.inventario,
              }}
            />
          </section>
          <nav aria-label={T.accesos} className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
            {MENU_NUEVO.map(({ ruta, etiqueta, icono: Icono }) => (
              <Link
                key={ruta}
                to={ruta}
                className="flex min-h-[56px] items-center gap-2.5 rounded-md border border-divisor px-4 text-base text-tinta no-underline hover:bg-tinta/7 hover:text-tinta"
              >
                <Icono aria-hidden size={18} className="text-acento-700" />
                {etiqueta}
              </Link>
            ))}
          </nav>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-6">
            <Bloque
              id="titulo-stock"
              icono={<TriangleAlert aria-hidden size={20} />}
              titulo={TEXTOS_REPORTES.stock.titulo}
              enlace={{ a: "/inventario", etiqueta: TEXTOS_REPORTES.stock.verInventario }}
            >
              <ListaStockBajo productos={inicio.stockBajo ?? []} />
            </Bloque>
            <Garantias inicio={inicio} />
            <Cotizaciones inicio={inicio} />
          </div>
          <Movimientos inicio={inicio} />
        </>
      )}
    </div>
  );
}
