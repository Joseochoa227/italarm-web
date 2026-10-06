import { Pencil, TriangleAlert } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { hoyBogota, sumarDias } from "@/lib/fechas";
import { formatearDecimal, formatearFecha, formatearFechaHora } from "@/lib/formato";

import type { ModoTasa } from "../components/DialogoTasa";
import { type Par, type Tasa, type TasaVigente, useTasasVigentes } from "../hooks/consultasTasas";
import { comoTasa, useDialogoTasa } from "../hooks/useDialogoTasa";
import { useReintentarTrm } from "../hooks/useReintentarTrm";
import { NOMBRE_PAR, TEXTOS_TASAS } from "../textos";

const T = TEXTOS_TASAS;
const DIAS_POR_DEFECTO = 30;
const MAXIMO_FILAS = 100;
const DIAS_CON_CORRECCIONES = 31;

function Procedencia({
  tasa,
}: {
  tasa: { fuente?: Tasa["fuente"]; registradaPor?: string; registradaEn?: string };
}) {
  const partes = [
    tasa.fuente ? T.fuente[tasa.fuente] : null,
    tasa.registradaEn ? formatearFechaHora(tasa.registradaEn) : null,
    tasa.registradaPor ?? null,
  ].filter(Boolean);
  return <span className="text-xs text-neutro-700">{partes.join(" · ")}</span>;
}

function TarjetaTasa({
  titulo,
  tasa,
  acciones,
}: {
  titulo: string;
  tasa: TasaVigente | undefined;
  acciones: React.ReactNode;
}) {
  return (
    <Tarjeta>
      <span className="rotulo text-acento-700">{titulo}</span>
      <span className="font-titulo text-[34px] leading-none font-semibold">
        {tasa?.valor ? formatearDecimal(tasa.valor) : T.sinTasa}
      </span>
      {tasa?.valor && (
        <span className="text-sm">
          {tasa.fecha && formatearFecha(tasa.fecha)} · <Procedencia tasa={tasa} />
        </span>
      )}
      {tasa?.aviso && (
        <span className="flex items-start gap-1.5 text-sm font-medium text-acento-900">
          <TriangleAlert aria-hidden size={16} className="mt-0.5 shrink-0" />
          {tasa.aviso}
        </span>
      )}
      <div className="flex flex-wrap gap-2">{acciones}</div>
    </Tarjeta>
  );
}

/** Historial de un par en el rango (RF-34). La API pagina por par; se piden hasta 100 días. */
function useHistorial(par: Par, desde: string, hasta: string) {
  return $api.useQuery("get", "/api/v1/tasas", {
    params: { query: { par, desde, hasta, size: MAXIMO_FILAS, page: 0 } },
  });
}

interface Fila {
  fecha: string;
  trm?: Tasa;
  ves?: Tasa;
}

function CeldaTasa({ tasa, par, abrir }: { tasa: Tasa | undefined; par: Par; abrir: (m: ModoTasa) => void }) {
  if (!tasa?.valor) return <span className="text-neutro-500">—</span>;
  return (
    <span className="flex flex-wrap items-center gap-x-2">
      <strong>{formatearDecimal(tasa.valor)}</strong>
      <span className="text-xs text-neutro-700">{tasa.fuente ? T.fuente[tasa.fuente] : ""}</span>
      <Boton
        variante="fantasma"
        icono
        aria-label={`${T.corregir} ${NOMBRE_PAR[par]} del ${tasa.fecha ? formatearFecha(tasa.fecha) : ""}`}
        onClick={() => {
          abrir({ tipo: "CORREGIR", tasa });
        }}
      >
        <Pencil aria-hidden size={14} />
      </Boton>
    </span>
  );
}

/** Pantalla de tasas de cambio del prototipo (3.5). */
export function Component() {
  const vigentes = useTasasVigentes();
  const configuracion = $api.useQuery("get", "/api/v1/configuracion");
  const { abrir, dialogo } = useDialogoTasa(vigentes.data?.bolivar);
  const reintentar = useReintentarTrm();

  const hoy = hoyBogota();
  const [desde, setDesde] = useState(sumarDias(hoy, -(DIAS_POR_DEFECTO - 1)));
  const [hasta, setHasta] = useState(hoy);
  const trm = useHistorial("USD_COP", desde, hasta);
  const ves = useHistorial("USD_VES", desde, hasta);

  // Una fila por fecha con las dos tasas, de la más reciente a la más antigua (prototipo).
  const filas = useMemo<Fila[]>(() => {
    const porFecha = new Map<string, Fila>();
    for (const [clave, lista] of [
      ["trm", trm.data?.contenido],
      ["ves", ves.data?.contenido],
    ] as const) {
      for (const tasa of lista ?? []) {
        if (!tasa.fecha) continue;
        const fila = porFecha.get(tasa.fecha) ?? { fecha: tasa.fecha };
        fila[clave] = tasa;
        porFecha.set(tasa.fecha, fila);
      }
    }
    return [...porFecha.values()].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [trm.data, ves.data]);

  // D-06: el listado trae `correcciones` vacío; solo el detalle de cada tasa las incluye. Se pide el
  // detalle de las fechas más recientes del rango (máximo DIAS_CON_CORRECCIONES).
  const conDetalle = filas
    .slice(0, DIAS_CON_CORRECCIONES)
    .flatMap((f) => [f.trm, f.ves])
    .filter((t): t is Tasa & { id: number } => t?.id !== undefined);
  const detalles = useQueries({
    queries: conDetalle.map((t) => ({
      ...$api.queryOptions("get", "/api/v1/tasas/{id}", { params: { path: { id: t.id } } }),
      staleTime: 5 * 60_000,
    })),
  });
  const correcciones = detalles
    .flatMap((d) => (d.data?.correcciones ?? []).map((c) => ({ tasa: d.data, c })))
    .sort((a, b) => (b.c.corregidaEn ?? "").localeCompare(a.c.corregidaEn ?? ""));
  const correccionesParciales = filas.length > DIAS_CON_CORRECCIONES;

  const datos = vigentes.data;
  const bolivarHoy = datos?.bolivar?.esDeHoy ? comoTasa(datos.bolivar) : null;
  const limite = configuracion.data?.limiteVariacionTasa;
  const truncado = (trm.data?.totalPaginas ?? 0) > 1 || (ves.data?.totalPaginas ?? 0) > 1;
  const errorHistorial = errorDeConsultas(trm, ves);

  return (
    <>
      <EncabezadoPagina titulo={T.titulo} subtitulo={T.subtitulo} />
      {vigentes.isError && (
        <EstadoError error={vigentes.error} alReintentar={() => void vigentes.refetch()} />
      )}

      <div className="grid gap-4 escritorio:grid-cols-2">
        <TarjetaTasa
          titulo={T.trm}
          tasa={datos?.trm}
          acciones={
            !datos?.trm?.esDeHoy && (
              <>
                <Boton
                  ocupado={reintentar.isPending}
                  onClick={() => {
                    reintentar.mutate();
                  }}
                >
                  {T.reintentarTrm}
                </Boton>
                {datos?.trmAutomaticaFallo && (
                  <Boton
                    variante="primario"
                    onClick={() => {
                      abrir({ tipo: "TRM" });
                    }}
                  >
                    {T.ingresarTrm}
                  </Boton>
                )}
              </>
            )
          }
        />
        <TarjetaTasa
          titulo={T.bolivar}
          tasa={datos?.bolivar}
          acciones={
            bolivarHoy ? (
              <Boton
                onClick={() => {
                  abrir({ tipo: "CORREGIR", tasa: bolivarHoy });
                }}
              >
                {T.corregirVesHoy}
              </Boton>
            ) : (
              <Boton
                variante="primario"
                onClick={() => {
                  abrir({ tipo: "VES" });
                }}
              >
                {T.registrarVes}
              </Boton>
            )
          }
        />
      </div>
      {limite && <p className="m-0 text-sm text-neutro-700">{T.reglas(formatearDecimal(limite))}</p>}

      <section aria-labelledby="titulo-historial" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <h2 id="titulo-historial" className="m-0 flex-1 text-[22px]">
            {T.historial}
          </h2>
          <Campo
            etiqueta={T.desde}
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => {
              setDesde(e.target.value);
            }}
          />
          <Campo
            etiqueta={T.hasta}
            type="date"
            value={hasta}
            min={desde}
            max={hoy}
            onChange={(e) => {
              setHasta(e.target.value);
            }}
          />
        </div>
        {errorHistorial ? (
          <EstadoError
            error={errorHistorial}
            alReintentar={() => {
              void trm.refetch();
              void ves.refetch();
            }}
          />
        ) : trm.isPending || ves.isPending ? (
          <CargandoLista />
        ) : filas.length === 0 ? (
          <p className="m-0 text-sm text-neutro-700">{T.sinHistorial}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-divisor text-left text-[11px] tracking-[0.08em] text-tinta/60 uppercase">
                  <th className="p-2 font-normal">Fecha</th>
                  <th className="p-2 font-normal">USD/COP</th>
                  <th className="p-2 font-normal">USD/VES</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.fecha} className="border-b border-tinta/8">
                    <td className="p-2 whitespace-nowrap">{formatearFecha(f.fecha)}</td>
                    <td className="p-2">
                      <CeldaTasa tasa={f.trm} par="USD_COP" abrir={abrir} />
                    </td>
                    <td className="p-2">
                      <CeldaTasa tasa={f.ves} par="USD_VES" abrir={abrir} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {truncado && <p className="m-0 text-xs text-neutro-700">{T.limiteHistorial}</p>}
      </section>

      <section aria-labelledby="titulo-correcciones" className="flex flex-col gap-2">
        <h2 id="titulo-correcciones" className="m-0 text-[22px]">
          {T.correcciones}
        </h2>
        <Alerta>{T.correccionesNota}</Alerta>
        {correccionesParciales && (
          <p className="m-0 text-xs text-neutro-700">{T.correccionesParciales(DIAS_CON_CORRECCIONES)}</p>
        )}
        {correcciones.length === 0 ? (
          <p className="m-0 text-sm text-neutro-700">{T.sinCorrecciones}</p>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {correcciones.map(({ tasa, c }, i) => (
              <li
                key={`${String(tasa?.id)}-${String(i)}`}
                className="flex flex-col gap-0.5 border-b border-divisor py-3 text-sm"
              >
                <span>
                  <strong>
                    {tasa?.par ? NOMBRE_PAR[tasa.par] : ""} · {tasa?.fecha ? formatearFecha(tasa.fecha) : ""}
                  </strong>
                  : {c.valorAnterior ? formatearDecimal(c.valorAnterior) : "—"} →{" "}
                  {c.valorNuevo ? formatearDecimal(c.valorNuevo) : "—"}
                </span>
                <span className="text-xs text-neutro-700">
                  {[
                    c.automatica ? T.trmOficial : c.corregidaPor,
                    c.corregidaEn && formatearFechaHora(c.corregidaEn),
                    c.motivo,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {dialogo}
    </>
  );
}
