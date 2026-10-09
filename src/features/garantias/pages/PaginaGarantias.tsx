import { ShieldCheck } from "lucide-react";
import { Link } from "react-router";

import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { errorDeConsultas } from "@/api/problema";
import { Buscador } from "@/components/ui/Buscador";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Paginacion } from "@/components/ui/Paginacion";
import { Segmentado } from "@/components/ui/Segmentado";
import { FiltroCliente } from "@/features/comercial/components/SelectorCliente";
import { EnlaceDocumento } from "@/features/inventario/components/EnlaceDocumento";
import { useFiltrosUrl } from "@/lib/filtrosUrl";
import { formatearFecha } from "@/lib/formato";

import { ListaReclamos, RegistrarReclamo } from "../components/Reclamos";
import { TEXTOS_GARANTIAS } from "../textos";

const T = TEXTOS_GARANTIAS;
const ESTADOS = [
  { valor: "todos", etiqueta: T.filtros.todos },
  { valor: "VIGENTE", etiqueta: T.estados.VIGENTE ?? "" },
  { valor: "POR_VENCER", etiqueta: T.estados.POR_VENCER ?? "" },
  { valor: "VENCIDA", etiqueta: T.estados.VENCIDA ?? "" },
] as const;
const TIPOS = [
  { valor: "todos", etiqueta: T.filtros.tipos.todos },
  { valor: "INSTALACION", etiqueta: T.filtros.tipos.INSTALACION },
  { valor: "VENTA", etiqueta: T.filtros.tipos.VENTA },
] as const;
type Estado = (typeof ESTADOS)[number]["valor"];
type Tipo = (typeof TIPOS)[number]["valor"];

function FilaGarantia({ g }: { g: components["schemas"]["GarantiaVista"] }) {
  const esEquipo = g.clase === "EQUIPO";
  const objetivo =
    esEquipo && g.serialId !== undefined
      ? { serialId: g.serialId }
      : !esEquipo && g.documento?.id !== undefined
        ? { instalacionId: g.documento.id }
        : null;
  return (
    <li className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-divisor px-2 py-3 text-sm">
      <div className="flex min-w-[220px] flex-[2] flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2 font-medium">
          {g.estado && (
            <Etiqueta
              tono={g.estado === "VIGENTE" ? "acento" : g.estado === "VENCIDA" ? "neutro" : "contorno"}
            >
              {T.estados[g.estado] ?? g.estado}
            </Etiqueta>
          )}
          {g.clase ? (T.clases[g.clase] ?? g.clase) : ""}
          {esEquipo && g.producto && ` · ${g.producto}`}
        </span>
        <span className="text-xs text-neutro-700">
          {g.serial &&
            (g.serialId === undefined ? (
              g.serial
            ) : (
              <Link to={`/seriales/${String(g.serialId)}`} className="font-mono">
                {g.serial}
              </Link>
            ))}
          {g.serial && " · "}
          {g.cliente}
          {" · "}
          <EnlaceDocumento documento={g.documento} />
        </span>
      </div>
      <div className="flex min-w-[150px] flex-col">
        <span>{g.vencimiento ? T.vence(formatearFecha(g.vencimiento)) : ""}</span>
        {g.diasRestantes !== undefined && (
          <span className="text-xs text-neutro-700">{T.dias(g.diasRestantes)}</span>
        )}
      </div>
      {objetivo && (
        <RegistrarReclamo
          sobre={esEquipo ? `${g.producto ?? ""} · ${g.serial ?? ""}` : (g.documento?.consecutivo ?? "")}
          objetivo={objetivo}
        />
      )}
    </li>
  );
}

/** Consulta de garantías (RF-123, RF-124) y reclamos (RF-125). Se llega desde instalaciones, ventas, el cliente y el serial (W-10). */
export function Component() {
  const filtros = useFiltrosUrl();
  const estado: Estado = ESTADOS.find((e) => e.valor === filtros.leer("estado"))?.valor ?? "todos";
  const tipo: Tipo = TIPOS.find((t) => t.valor === filtros.leer("tipo"))?.valor ?? "todos";
  const cliente = filtros.leer("cliente");
  const clienteNombre = filtros.leer("clienteNombre");
  const serial = filtros.leer("serial");
  const consulta = $api.useQuery("get", "/api/v1/garantias", {
    params: {
      query: {
        page: filtros.paginaApi,
        size: 20,
        ...(estado === "todos" ? {} : { estado }),
        ...(tipo === "todos" ? {} : { tipo }),
        ...(cliente ? { clienteId: Number(cliente) } : {}),
        ...(serial ? { serial } : {}),
      },
    },
  });
  const error = errorDeConsultas(consulta);
  const garantias = consulta.data?.contenido ?? [];

  return (
    <>
      <EncabezadoPagina titulo={T.titulo} subtitulo={T.subtitulo} />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Buscador
            etiqueta={T.filtros.serial}
            placeholder={T.filtros.serial}
            valor={serial}
            alBuscar={(texto) => {
              filtros.cambiar({ serial: texto.trim().toUpperCase() });
            }}
          />
          <FiltroCliente
            nombre={cliente ? clienteNombre || cliente : null}
            alElegir={(c) => {
              filtros.cambiar({ cliente: String(c.id), clienteNombre: c.nombre ?? "" });
            }}
            alQuitar={() => {
              filtros.cambiar({ cliente: "", clienteNombre: "" });
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmentado
            etiqueta={T.filtros.estado}
            valor={estado}
            opciones={ESTADOS}
            alCambiar={(valor) => {
              filtros.cambiar({ estado: valor === "todos" ? "" : valor });
            }}
          />
          <Segmentado
            etiqueta={T.filtros.tipo}
            valor={tipo}
            opciones={TIPOS}
            alCambiar={(valor) => {
              filtros.cambiar({ tipo: valor === "todos" ? "" : valor });
            }}
          />
        </div>
      </div>
      {error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista />
      ) : garantias.length === 0 ? (
        <EstadoVacio icono={<ShieldCheck aria-hidden size={28} />} titulo={T.vacio} />
      ) : (
        <>
          <ul aria-label={T.lista} className="m-0 flex list-none flex-col border-t border-divisor p-0">
            {garantias.map((g, i) => (
              <FilaGarantia key={`${g.clase ?? ""}-${String(g.serialId ?? g.documento?.id ?? i)}`} g={g} />
            ))}
          </ul>
          <Paginacion
            pagina={filtros.pagina}
            totalPaginas={consulta.data?.totalPaginas ?? 1}
            alCambiar={filtros.cambiarPagina}
          />
        </>
      )}
      {cliente && (
        <section aria-labelledby="titulo-reclamos-cliente" className="flex flex-col gap-2">
          <h2 id="titulo-reclamos-cliente" className="m-0 text-[22px]">
            {T.reclamos.titulo} · {clienteNombre}
          </h2>
          <ListaReclamos filtro={{ clienteId: Number(cliente) }} />
        </section>
      )}
    </>
  );
}
