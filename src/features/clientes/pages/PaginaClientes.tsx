import { Plus, Users } from "lucide-react";
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
import { useFiltrosUrl } from "@/lib/filtrosUrl";
import { formatearFecha } from "@/lib/formato";

import { iniciales } from "../hooks/clientes";
import { TEXTOS_CLIENTES } from "../textos";

const T = TEXTOS_CLIENTES;
type Filtro = "todos" | "INSTALADOR" | "CLIENTE_FINAL";
const FILTROS = [
  { valor: "todos", etiqueta: T.tiposPlural.todos },
  { valor: "INSTALADOR", etiqueta: T.tiposPlural.INSTALADOR },
  { valor: "CLIENTE_FINAL", etiqueta: T.tiposPlural.CLIENTE_FINAL },
] as const;

/** Clientes (RF-76): filtro por tipo, buscador y resumen de movimientos. */
export function Component() {
  const filtros = useFiltrosUrl();
  const buscar = filtros.leer("buscar");
  const tipo: Filtro = FILTROS.find((f) => f.valor === filtros.leer("tipo"))?.valor ?? "todos";
  const consulta = $api.useQuery("get", "/api/v1/clientes", {
    params: {
      query: {
        page: filtros.paginaApi,
        size: 20,
        ...(buscar ? { buscar } : {}),
        ...(tipo === "todos" ? {} : { tipo }),
      },
    },
  });
  const error = errorDeConsultas(consulta);
  const clientes = consulta.data?.contenido ?? [];

  return (
    <>
      <EncabezadoPagina
        titulo={T.titulo}
        subtitulo={T.subtitulo}
        acciones={
          <Link
            to="/clientes/nuevo"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md bg-acento-700 px-4 font-titulo text-[15px] font-semibold text-fondo no-underline hover:bg-acento-800 hover:text-fondo"
          >
            <Plus aria-hidden size={16} />
            {T.nuevo}
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <Segmentado
          etiqueta={T.filtroTipo}
          valor={tipo}
          opciones={FILTROS}
          alCambiar={(valor) => {
            filtros.cambiar({ tipo: valor === "todos" ? "" : valor });
          }}
        />
        <Buscador
          etiqueta={T.buscar}
          placeholder={T.buscar}
          valor={buscar}
          alBuscar={(texto) => {
            filtros.cambiar({ buscar: texto });
          }}
        />
      </div>
      {error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista />
      ) : clientes.length === 0 ? (
        <EstadoVacio
          icono={<Users aria-hidden size={28} />}
          titulo={buscar || tipo !== "todos" ? T.vacio : T.vacioSinFiltros}
        />
      ) : (
        <>
          <ListaFilas etiqueta={T.titulo}>
            {clientes.map((c) => (
              <FilaEnlace key={c.id} a={`/clientes/${String(c.id)}`} etiqueta={c.nombre ?? ""}>
                <div className="flex min-w-[220px] flex-[2] items-center gap-3">
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-acento-100 font-titulo font-semibold text-acento-800"
                  >
                    {iniciales(c.nombre)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium">{c.nombre}</div>
                    <div className="text-xs text-neutro-700">
                      {[c.telefono, c.ciudad].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
                {c.tipo && (
                  <Etiqueta tono={c.tipo === "INSTALADOR" ? "acento" : "neutro"}>{T.tipos[c.tipo]}</Etiqueta>
                )}
                <span className="min-w-[160px] text-sm text-neutro-700">
                  {c.cantidadMovimientos
                    ? [
                        T.movimientos(c.cantidadMovimientos),
                        c.fechaUltimoMovimiento && T.ultimo(formatearFecha(c.fechaUltimoMovimiento)),
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : T.sinMovimientos}
                </span>
              </FilaEnlace>
            ))}
          </ListaFilas>
          <Paginacion
            pagina={filtros.pagina}
            totalPaginas={consulta.data?.totalPaginas ?? 1}
            alCambiar={filtros.cambiarPagina}
          />
        </>
      )}
    </>
  );
}
