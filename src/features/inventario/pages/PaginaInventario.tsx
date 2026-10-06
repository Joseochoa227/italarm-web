import { Package, Plus } from "lucide-react";
import { Link } from "react-router";

import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { Buscador } from "@/components/ui/Buscador";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { FilaEnlace, ListaFilas } from "@/components/ui/ListaFilas";
import { Paginacion } from "@/components/ui/Paginacion";
import { Segmentado } from "@/components/ui/Segmentado";
import { cx } from "@/lib/clases";
import { useFiltrosUrl } from "@/lib/filtrosUrl";
import { formatearCantidad, formatearDineroDe } from "@/lib/formato";

import type { Producto } from "../hooks/productos";
import { TEXTOS_PRODUCTOS } from "../textos";

const T = TEXTOS_PRODUCTOS;
type Estado = "activos" | "inactivos" | "todos";
const ESTADOS = [
  { valor: "activos", etiqueta: T.estados.activos },
  { valor: "inactivos", etiqueta: T.estados.inactivos },
  { valor: "todos", etiqueta: T.estados.todos },
] as const;
const ACTIVO: Record<Estado, boolean | undefined> = { activos: true, inactivos: false, todos: undefined };

function FilaProducto({ p }: { p: Producto }) {
  const unidad = p.unidadMedida?.abreviatura ?? "";
  return (
    <FilaEnlace a={`/inventario/productos/${String(p.id)}/editar`} etiqueta={p.nombre ?? ""}>
      <div className="flex min-w-[220px] flex-[2] items-center gap-3">
        <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-md bg-superficie">
          {p.fotoUrl ? (
            <img src={p.fotoUrl} alt="" className="size-full object-cover" />
          ) : (
            <Package aria-hidden size={20} className="text-neutro-600" />
          )}
        </div>
        <div className="min-w-0">
          <div className="font-medium">{p.nombre}</div>
          <div className="text-xs text-neutro-700">
            {[p.codigo, p.categoria?.nombre, p.controlaSerial ? T.conSerial : T.sinSerial]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
      </div>
      <div className="flex min-w-[90px] flex-col">
        <span className="text-[11px] text-neutro-700">{T.stock}</span>
        <span className="flex items-center gap-1.5 font-medium">
          {formatearCantidad(p.stock ?? "0")} {unidad}
          {p.bajoMinimo && <Etiqueta tono="peligro">{T.bajo}</Etiqueta>}
        </span>
      </div>
      <div className="flex min-w-[110px] flex-col">
        <span className="text-[11px] text-neutro-700">{T.instalador}</span>
        <span>{p.precioInstalador ? formatearDineroDe(p.precioInstalador) : "—"}</span>
      </div>
      <div className="flex min-w-[110px] flex-col">
        <span className="text-[11px] text-neutro-700">{T.clienteFinal}</span>
        <span>{p.precioClienteFinal ? formatearDineroDe(p.precioClienteFinal) : "—"}</span>
      </div>
      {p.activo === false && <Etiqueta>{T.inactivo}</Etiqueta>}
    </FilaEnlace>
  );
}

/** Inventario · catálogo de productos (3.3). En la Fase 2 se suman el valor en bodega y el kárdex. */
export function Component() {
  const filtros = useFiltrosUrl();
  const buscar = filtros.leer("buscar");
  const categoria = filtros.leer("categoria");
  const estado = (ESTADOS.find((e) => e.valor === filtros.leer("estado"))?.valor ??
    "activos") satisfies Estado;
  const activo = ACTIVO[estado];

  const categorias = $api.useQuery("get", "/api/v1/categorias");
  const consulta = $api.useQuery("get", "/api/v1/productos", {
    params: {
      query: {
        page: filtros.paginaApi,
        size: 20,
        ...(buscar ? { buscar } : {}),
        ...(categoria ? { categoriaId: Number(categoria) } : {}),
        ...(activo === undefined ? {} : { activo }),
      },
    },
  });
  const error = errorDeConsultas(consulta);
  const pagina = consulta.data;
  const productos = pagina?.contenido ?? [];
  const hayFiltros = Boolean(buscar || categoria || estado !== "activos");

  return (
    <>
      <EncabezadoPagina
        titulo={T.titulo}
        subtitulo={pagina ? T.resumen(pagina.totalElementos ?? 0) : undefined}
        acciones={
          <Link
            to="/inventario/productos/nuevo"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md bg-acento-700 px-4 font-titulo text-[15px] font-semibold text-fondo no-underline hover:bg-acento-800 hover:text-fondo"
          >
            <Plus aria-hidden size={16} />
            {T.nuevo}
          </Link>
        }
      />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Buscador
            etiqueta={T.buscar}
            placeholder={T.buscar}
            valor={buscar}
            alBuscar={(texto) => {
              filtros.cambiar({ buscar: texto });
            }}
          />
          <Segmentado
            etiqueta={T.estado}
            valor={estado}
            opciones={ESTADOS}
            alCambiar={(valor) => {
              filtros.cambiar({ estado: valor === "activos" ? "" : valor });
            }}
          />
        </div>
        <div role="group" aria-label={T.filtroCategoria} className="flex gap-2 overflow-x-auto pb-1">
          {[{ id: undefined, nombre: T.todas }, ...(categorias.data ?? [])].map((c) => {
            const valor = c.id === undefined ? "" : String(c.id);
            const actual = valor === categoria;
            return (
              <button
                key={valor || "todas"}
                type="button"
                aria-pressed={actual}
                onClick={() => {
                  filtros.cambiar({ categoria: valor });
                }}
                className={cx(
                  "min-h-[36px] shrink-0 cursor-pointer rounded-full border px-3 text-[13px] whitespace-nowrap",
                  actual ? "border-acento-700 bg-acento-700 text-fondo" : "border-divisor hover:bg-tinta/7",
                )}
              >
                {c.nombre}
              </button>
            );
          })}
        </div>
      </div>
      {error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista />
      ) : productos.length === 0 ? (
        <EstadoVacio
          icono={<Package aria-hidden size={28} />}
          titulo={hayFiltros ? T.vacio : T.vacioSinFiltros}
        />
      ) : (
        <>
          <ListaFilas etiqueta={T.titulo}>
            {productos.map((p) => (
              <FilaProducto key={p.id} p={p} />
            ))}
          </ListaFilas>
          <Paginacion
            pagina={filtros.pagina}
            totalPaginas={pagina?.totalPaginas ?? 1}
            alCambiar={filtros.cambiarPagina}
          />
        </>
      )}
    </>
  );
}
