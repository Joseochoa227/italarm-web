import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, useParams } from "react-router";

import { $api, api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { errorDeConsultas } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { EstadoError } from "@/components/ui/EstadoError";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Celda, Tabla } from "@/components/ui/Tabla";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { AccionesComprobante } from "@/features/comercial/components/AccionesComprobante";
import { AnularDocumento } from "@/features/comercial/components/AnularDocumento";
import { TEXTOS_COMERCIAL } from "@/features/comercial/textos";
import { ListaReclamos, RegistrarReclamo } from "@/features/garantias/components/Reclamos";
import { TEXTOS_GARANTIAS } from "@/features/garantias/textos";
import {
  formatearCantidad,
  formatearDecimal,
  formatearDineroDe,
  formatearFecha,
  formatearFechaHora,
  separarMonedas,
} from "@/lib/formato";

import { comprobanteInstalacion, enlaceInstalacion } from "../comprobante";
import { EdicionInstalacion } from "../components/EdicionInstalacion";
import { GaleriaFotos } from "../components/GaleriaFotos";
import { type FotoGaleria, type GrupoFoto, subirFoto } from "../fotos";
import { TEXTOS_INSTALACIONES } from "../textos";

const T = TEXTOS_INSTALACIONES;
const D = T.detalle;
const C = TEXTOS_COMERCIAL.cobro;
type Instalacion = components["schemas"]["InstalacionVista"];
const CLAVES_FOTOS = { ANTES: "antes", DURANTE: "durante", DESPUES: "despues" } as const;

function Dato({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-neutro-700">{titulo}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}

function FilaResumen({
  titulo,
  montos,
  moneda,
  fuerte = false,
}: {
  titulo: string;
  montos: components["schemas"]["MontoEnMonedas"] | undefined;
  moneda: NonNullable<Instalacion["moneda"]>;
  fuerte?: boolean;
}) {
  const { principal, otros } = separarMonedas(montos, moneda);
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-neutro-700">{titulo}</span>
      <span className="text-right">
        <span className={fuerte ? "font-titulo text-[22px] font-semibold" : ""}>{principal}</span>
        {otros && <span className="block text-[11px] text-neutro-700">{otros}</span>}
      </span>
    </div>
  );
}

function EstadoGarantia({ estado }: { estado: string | undefined }) {
  if (!estado) return null;
  return (
    <Etiqueta tono={estado === "VIGENTE" ? "acento" : estado === "VENCIDA" ? "neutro" : "contorno"}>
      {T.estadosGarantia[estado] ?? estado}
    </Etiqueta>
  );
}

/** Detalle de la instalación (RF-121, RF-122): lo guardado, garantías, fotos, reclamos, edición y anulación. */
export function Component() {
  const id = Number(useParams().id);
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const [conflicto, setConflicto] = useState(false);
  const opciones = $api.queryOptions("get", "/api/v1/instalaciones/{id}", { params: { path: { id } } });
  const consulta = $api.useQuery("get", "/api/v1/instalaciones/{id}", { params: { path: { id } } });
  const error = errorDeConsultas(consulta);
  if (error) return <EstadoError error={error} alReintentar={() => void consulta.refetch()} />;
  const v = consulta.data;
  if (!v) return <CargandoLista filas={4} />;
  const anulada = v.estado === "ANULADA";
  const moneda = v.moneda ?? "USD";
  const consecutivo = v.consecutivo ?? "";
  const resumen = v.resumen;
  const garantias = v.garantias;

  const actualizar = async (nueva: Instalacion | undefined) => {
    setConflicto(false);
    if (nueva) clienteConsultas.setQueryData(opciones.queryKey, nueva);
    // La anulación mueve el inventario, los seriales, las garantías y los totales.
    await clienteConsultas.invalidateQueries({
      predicate: (q) => q.queryKey[1] !== "/api/v1/instalaciones/{id}",
      refetchType: "none",
    });
  };

  const fotos = (grupo: GrupoFoto): FotoGaleria[] =>
    (v.fotos?.[CLAVES_FOTOS[grupo]] ?? []).flatMap((f) =>
      f.id !== undefined && f.url ? [{ clave: String(f.id), url: f.url }] : [],
    );

  return (
    <>
      <EncabezadoPagina
        volver={{ a: "/instalaciones", etiqueta: D.volver }}
        antetitulo={[v.fecha ? formatearFecha(v.fecha) : null, moneda].filter(Boolean).join(" · ")}
        titulo={D.titulo(consecutivo)}
        subtitulo={v.cliente?.nombre}
        acciones={
          <>
            <AccionesComprobante
              consecutivo={consecutivo}
              obtenerPdf={() => comprobanteInstalacion(id, consecutivo)}
              obtenerEnlace={() => enlaceInstalacion(id)}
            />
            {!anulada && (
              <AnularDocumento
                textos={{
                  anular: D.anular,
                  titulo: D.anularTitulo(consecutivo),
                  texto: D.anularTexto,
                  motivo: D.motivo,
                  motivoRequerido: D.motivoRequerido,
                }}
                alAnular={async (motivo) => {
                  const { data } = await api.POST("/api/v1/instalaciones/{id}/anular", {
                    params: { path: { id } },
                    body: { motivo },
                  });
                  await actualizar(data);
                  avisar({ titulo: D.anulada(consecutivo) });
                }}
              />
            )}
          </>
        }
      />
      {anulada && (
        <Alerta tono="peligro">
          <span className="flex flex-col">
            <strong>{D.anuladaTitulo}</strong>
            {v.anulacion?.motivo}
            {v.anulacion?.usuario && v.anulacion.fecha && (
              <span className="text-xs">
                {D.anuladaDetalle(v.anulacion.usuario, formatearFechaHora(v.anulacion.fecha))}
              </span>
            )}
          </span>
        </Alerta>
      )}
      <Tarjeta>
        <dl className="m-0 grid gap-4 escritorio:grid-cols-3">
          <Dato titulo={D.cliente}>
            {v.cliente?.id === undefined ? (
              v.cliente?.nombre
            ) : (
              <Link to={`/clientes/${String(v.cliente.id)}`}>{v.cliente.nombre}</Link>
            )}
          </Dato>
          <Dato titulo={D.direccion}>{v.direccion ?? "—"}</Dato>
          <Dato titulo={D.tecnicos}>{(v.tecnicos ?? []).map((t) => t.nombre).join(", ") || "—"}</Dato>
          <Dato titulo={D.tasas}>
            {[
              v.tasas?.trm ? `TRM ${formatearDecimal(v.tasas.trm)}` : null,
              v.tasas?.tasaVes ? `Bs ${formatearDecimal(v.tasas.tasaVes)}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </Dato>
          <Dato titulo={D.registrada}>
            {[v.registradaPor, v.registradaEn ? formatearFechaHora(v.registradaEn) : null]
              .filter(Boolean)
              .join(" · ")}
          </Dato>
          {v.cotizacion?.consecutivo && <Dato titulo={D.cotizacion}>{v.cotizacion.consecutivo}</Dato>}
          <div className="escritorio:col-span-3">
            <Dato titulo={D.descripcion}>{v.descripcion}</Dato>
          </div>
        </dl>
      </Tarjeta>

      <section aria-labelledby="titulo-material" className="flex flex-col gap-2">
        <h2 id="titulo-material" className="m-0 text-[22px]">
          {D.material}
        </h2>
        {(v.lineas ?? []).length === 0 ? (
          <p className="m-0 text-sm text-neutro-700">{D.sinMaterial}</p>
        ) : (
          <Tabla etiqueta={D.material} columnas={Object.values(D.columnas)}>
            {(v.lineas ?? []).map((l) => (
              <tr key={l.productoId} className="border-b border-tinta/8 align-top">
                <Celda>
                  <span className="font-medium">{l.descripcion}</span>
                  <span className="block text-xs text-neutro-700">{l.codigo}</span>
                  {(l.seriales ?? []).map((s) => (
                    <span key={s.id ?? s.numero} className="block text-xs text-neutro-700">
                      <Link to={`/seriales/${String(s.id)}`} className="font-mono">
                        {s.numero}
                      </Link>
                    </span>
                  ))}
                </Celda>
                <Celda derecha>
                  {l.cantidad ? formatearCantidad(l.cantidad) : ""} {l.unidad}
                </Celda>
                <Celda derecha>
                  {l.precioUnitario ? formatearDineroDe(l.precioUnitario) : "—"}
                  {l.precioSugerido && l.precioSugerido.monto !== l.precioUnitario?.monto && (
                    <span className="block text-xs text-neutro-700">
                      {D.sugerido(formatearDineroDe(l.precioSugerido))}
                    </span>
                  )}
                </Celda>
                <Celda derecha>{l.subtotal ? formatearDineroDe(l.subtotal) : "—"}</Celda>
                <Celda derecha>{l.costoUnitarioUsd ? formatearDineroDe(l.costoUnitarioUsd) : "—"}</Celda>
              </tr>
            ))}
          </Tabla>
        )}
      </section>

      <div className="grid gap-4 escritorio:grid-cols-2">
        <Tarjeta aria-label={D.garantias} role="region" className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 flex-1 text-[22px]">{D.garantias}</h2>
            {v.cliente?.id !== undefined && (
              <EnlaceBoton
                a={`/garantias?cliente=${String(v.cliente.id)}&clienteNombre=${encodeURIComponent(v.cliente.nombre ?? "")}`}
                icono={<ShieldCheck aria-hidden size={16} />}
              >
                {TEXTOS_GARANTIAS.verGarantias}
              </EnlaceBoton>
            )}
          </div>
          {garantias?.venceManoObra && (
            <p className="m-0 flex flex-wrap items-center gap-2 text-sm">
              {D.manoObra(garantias.manoObraMeses ?? 3, formatearFecha(garantias.venceManoObra))}
              <EstadoGarantia estado={garantias.estadoManoObra} />
            </p>
          )}
          {garantias?.venceEquipos && (
            <p className="m-0 flex flex-wrap items-center gap-2 text-sm">
              {D.equipos(formatearFecha(garantias.venceEquipos))}
              <EstadoGarantia estado={garantias.estadoEquipos} />
            </p>
          )}
          {garantias?.condiciones && (
            <p className="m-0 text-xs text-neutro-700">
              {D.condiciones}: {garantias.condiciones}
            </p>
          )}
        </Tarjeta>
        <Tarjeta aria-label={D.resumen} role="region" className="gap-2">
          <FilaResumen titulo={C.material} montos={resumen?.material} moneda={moneda} />
          <FilaResumen titulo={C.manoDeObra} montos={resumen?.manoDeObra} moneda={moneda} />
          {(v.descuentoTipo === "PORCENTAJE" || v.descuentoTipo === "VALOR") && (
            <FilaResumen
              titulo={
                v.descuentoTipo === "PORCENTAJE" && v.descuentoValor
                  ? D.descuentoPorcentaje(formatearDecimal(v.descuentoValor))
                  : C.descuento
              }
              montos={resumen?.descuento}
              moneda={moneda}
            />
          )}
          <FilaResumen titulo={C.total} montos={resumen?.total} moneda={moneda} fuerte />
          <FilaResumen titulo={D.costoMaterial} montos={resumen?.costo} moneda={moneda} />
          <FilaResumen
            titulo={`${C.utilidad}${v.porcentajeUtilidad ? ` · ${formatearDecimal(v.porcentajeUtilidad)} %` : ""}`}
            montos={resumen?.utilidad}
            moneda={moneda}
          />
        </Tarjeta>
      </div>

      <section aria-labelledby="titulo-fotos" className="flex flex-col gap-2">
        <h2 id="titulo-fotos" className="m-0 text-[22px]">
          {D.fotos}
        </h2>
        <GaleriaFotos
          fotos={{ ANTES: fotos("ANTES"), DURANTE: fotos("DURANTE"), DESPUES: fotos("DESPUES") }}
          alAgregar={async (grupo, archivos) => {
            let ultima: Instalacion | undefined;
            // Una por una; si una falla, las anteriores ya quedaron y el error se muestra en el grupo.
            for (const archivo of archivos) ultima = await subirFoto(id, grupo, archivo);
            await actualizar(ultima);
            avisar({ titulo: T.fotos.agregadas(archivos.length) });
          }}
          alQuitar={async (_grupo, foto) => {
            const { data } = await api.DELETE("/api/v1/instalaciones/{id}/fotos/{fotoId}", {
              params: { path: { id, fotoId: Number(foto.clave) } },
            });
            await actualizar(data);
            avisar({ titulo: T.fotos.quitada });
          }}
        />
      </section>

      <section aria-labelledby="titulo-reclamos" className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="titulo-reclamos" className="m-0 flex-1 text-[22px]">
            {TEXTOS_GARANTIAS.reclamos.titulo}
          </h2>
          {!anulada && <RegistrarReclamo sobre={consecutivo} objetivo={{ instalacionId: id }} />}
        </div>
        <ListaReclamos filtro={{ instalacionId: id }} />
      </section>

      <EdicionInstalacion
        key={v.version}
        instalacion={v}
        conflicto={conflicto}
        alGuardar={actualizar}
        alConflicto={async () => {
          await consulta.refetch();
          setConflicto(true);
        }}
      />
    </>
  );
}
