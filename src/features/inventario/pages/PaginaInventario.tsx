import { ClipboardList, FileSpreadsheet, Package, Plus, Truck } from "lucide-react";
import { Link } from "react-router";

import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { errorDeConsultas } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { Buscador } from "@/components/ui/Buscador";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { FilaEnlace, ListaFilas } from "@/components/ui/ListaFilas";
import { Paginacion } from "@/components/ui/Paginacion";
import { Segmentado } from "@/components/ui/Segmentado";
import { cx } from "@/lib/clases";
import { useFiltrosUrl } from "@/lib/filtrosUrl";
import { formatearCantidad, formatearDineroDe, formatearEnMonedas } from "@/lib/formato";

import { TEXTOS_PRODUCTOS } from "../textos";
import { TEXTOS_INVENTARIO } from "../textosInventario";

type ProductoInventario = components["schemas"]["InventarioVistaProducto"];
const T = TEXTOS_PRODUCTOS;
const L = TEXTOS_INVENTARIO.listado;
type Estado = "activos" | "inactivos" | "todos";
const ESTADOS = [
  { valor: "activos", etiqueta: T.estados.activos },
  { valor: "inactivos", etiqueta: T.estados.inactivos },
  { valor: "todos", etiqueta: T.estados.todos },
] as const;
const ACTIVO: Record<Estado, boolean | undefined> = { activos: true, inactivos: false, todos: undefined };

function FilaProducto({ p }: { p: ProductoInventario }) {
  return (
    <FilaEnlace a={`/inventario/productos/${String(p.id)}`} etiqueta={p.nombre ?? ""}>
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
            {[p.codigo, p.categoria, p.marca, p.controlaSerial ? T.conSerial : null]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
      </div>
      <div className="flex min-w-[90px] flex-col">
        <span className="text-[11px] text-neutro-700">{T.stock}</span>
        <span className="flex items-center gap-1.5 font-medium">
          {formatearCantidad(p.stock ?? "0")} {p.abreviatura}
          {p.bajoMinimo && <Etiqueta tono="peligro">{T.bajo}</Etiqueta>}
        </span>
      </div>
      <div className="flex min-w-[100px] flex-col">
        <span className="text-[11px] text-neutro-700">{L.costo}</span>
        <span>{p.costoActualUsd ? formatearDineroDe(p.costoActualUsd) : "—"}</span>
      </div>
      <div className="flex min-w-[160px] flex-[1.5] flex-col">
        <span className="text-[11px] text-neutro-700">{L.valor}</span>
        <span className="font-medium">
          {p.valorEnBodega?.usd ? formatearDineroDe(p.valorEnBodega.usd) : "—"}
        </span>
        <span className="text-xs text-neutro-700">
          {[p.valorEnBodega?.cop, p.valorEnBodega?.ves]
            .flatMap((d) => (d ? [formatearDineroDe(d)] : []))
            .join(" · ")}
        </span>
      </div>
      {p.activo === false && <Etiqueta>{T.inactivo}</Etiqueta>}
    </FilaEnlace>
  );
}

/** Inventario valorizado (RF-49 a RF-52): stock, costo en USD y valor en bodega en las tres monedas. */
export function Component() {
  const filtros = useFiltrosUrl();
  const buscar = filtros.leer("buscar");
  const categoria = filtros.leer("categoria");
  const estado: Estado = ESTADOS.find((e) => e.valor === filtros.leer("estado"))?.valor ?? "activos";
  const activo = ACTIVO[estado];

  const categorias = $api.useQuery("get", "/api/v1/categorias");
  const consulta = $api.useQuery("get", "/api/v1/inventario", {
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
  const datos = consulta.data;
  const productos = datos?.productos?.contenido ?? [];
  const hayFiltros = Boolean(buscar || categoria || estado !== "activos");

  return (
    <>
      <EncabezadoPagina
        titulo={T.titulo}
        subtitulo={
          datos
            ? `${T.resumen(datos.totalProductos ?? 0)} · ${L.valorTotal}: ${formatearEnMonedas(datos.valorTotal)}`
            : undefined
        }
        acciones={
          <>
            <EnlaceBoton a="/inventario/ajustes" icono={<ClipboardList aria-hidden size={16} />}>
              {L.ajustes}
            </EnlaceBoton>
            <EnlaceBoton a="/compras/nueva" icono={<Truck aria-hidden size={16} />}>
              {L.registrarCompra}
            </EnlaceBoton>
            <EnlaceBoton
              a="/inventario/productos/nuevo"
              variante="primario"
              icono={<Plus aria-hidden size={16} />}
            >
              {T.nuevo}
            </EnlaceBoton>
          </>
        }
      />
      {(datos?.avisos ?? []).map((aviso) => (
        <Alerta key={aviso} tono="aviso">
          {aviso}
        </Alerta>
      ))}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Buscador
            etiqueta={L.buscar}
            placeholder={L.buscar}
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
          titulo={hayFiltros ? T.vacio : L.vacioSinFiltros}
        >
          {!hayFiltros && (
            <Link to="/configuracion?pestana=carga" className="inline-flex items-center gap-1.5">
              <FileSpreadsheet aria-hidden size={16} />
              {L.cargaInicial}
            </Link>
          )}
        </EstadoVacio>
      ) : (
        <>
          <ListaFilas etiqueta={T.titulo}>
            {productos.map((p) => (
              <FilaProducto key={p.id} p={p} />
            ))}
          </ListaFilas>
          <Paginacion
            pagina={filtros.pagina}
            totalPaginas={datos?.productos?.totalPaginas ?? 1}
            alCambiar={filtros.cambiarPagina}
          />
        </>
      )}
    </>
  );
}
