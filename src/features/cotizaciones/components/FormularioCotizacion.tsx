import { zodResolver } from "@hookform/resolvers/zod";
import { List } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Controller, type Path, useFieldArray, useForm, useWatch } from "react-hook-form";

import type { components } from "@/api/esquema";
import { comoErrorApi, errorDeConsultas, type ErrorApi } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { Segmentado } from "@/components/ui/Segmentado";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { useSesion } from "@/features/auth/hooks/contextoSesion";
import { LineaMaterial } from "@/features/comercial/components/LineaMaterial";
import { ResumenCobro } from "@/features/comercial/components/ResumenCobro";
import { type Cliente, SelectorCliente } from "@/features/comercial/components/SelectorCliente";
import { lineaDeProducto, MONEDAS } from "@/features/comercial/schemas/material";
import { TEXTOS_COMERCIAL } from "@/features/comercial/textos";
import { SelectorProducto } from "@/features/inventario/components/SelectorProducto";
import { aplicarErroresDeCampo, mensajeDeError } from "@/lib/errores";
import { hoyBogota } from "@/lib/fechas";
import { formatearDecimal, formatearFecha } from "@/lib/formato";
import { useEsEscritorio } from "@/lib/medios";

import { useVistaPreviaCotizacion } from "../hooks/vistaPrevia";
import {
  type DatosCotizacion,
  type EntradaCotizacion,
  esquemaCotizacion,
  TIPOS_COTIZACION,
  VALIDECES,
} from "../schemas/cotizacion";
import { TEXTOS_COTIZACIONES } from "../textos";
import { VistaPreviaPdf } from "./VistaPreviaPdf";

const N = TEXTOS_COTIZACIONES.nueva;
const OPCIONES_MONEDA = MONEDAS.map((m) => ({ valor: m, etiqueta: m }));
const OPCIONES_TIPO = TIPOS_COTIZACION.map((t) => ({
  valor: t,
  etiqueta: TEXTOS_COTIZACIONES.tipos[t] ?? t,
}));
const OPCIONES_VALIDEZ = VALIDECES.map((d) => ({ valor: d, etiqueta: N.dias(Number(d)) }));
const CODIGOS: Partial<Record<string, Path<EntradaCotizacion>>> = {
  CLIENTE_NO_EXISTE: "clienteId",
  DESCUENTO_INVALIDO: "descuentoValor",
  COTIZACION_SIN_DESCRIPCION: "descripcion",
  COTIZACION_VACIA: "lineas",
};

function Seccion({ numero, titulo, children }: { numero: string; titulo: string; children: ReactNode }) {
  return (
    <Tarjeta className="gap-4">
      <h2 className="m-0 text-[22px]">
        <span className="text-acento-700">{numero}</span> {titulo}
      </h2>
      {children}
    </Tarjeta>
  );
}

/**
 * Formulario de la cotización (RF-80 a RF-86), para crearla o editarla: tipo, cliente, validez,
 * ítems sin seriales con su costo interno (CP-09), cobro y, en el computador, la vista previa del
 * PDF (W-12). `alGuardar` hace la petición y lanza el error del backend.
 */
export function FormularioCotizacion({
  valoresIniciales,
  clienteInicial,
  configuracion,
  titulo,
  consecutivo,
  aviso,
  textoGuardar,
  alGuardar,
}: {
  valoresIniciales: EntradaCotizacion;
  clienteInicial: Cliente | null;
  configuracion: components["schemas"]["ConfiguracionVista"] | undefined;
  titulo: string;
  consecutivo?: string;
  aviso?: ReactNode;
  textoGuardar: string;
  alGuardar: (datos: DatosCotizacion) => Promise<void>;
}) {
  const hoy = hoyBogota();
  const escritorio = useEsEscritorio();
  const { usuario } = useSesion();
  const [cliente, setCliente] = useState<Cliente | null>(clienteInicial);
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<ErrorApi | null>(null);
  const [monedaCambiada, setMonedaCambiada] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<EntradaCotizacion, unknown, DatosCotizacion>({
    resolver: zodResolver(esquemaCotizacion),
    defaultValues: valoresIniciales,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "lineas" });
  const entrada = useWatch({ control }) as EntradaCotizacion;
  const moneda = entrada.moneda;
  const instalacion = entrada.tipo === "INSTALACION";
  const { consulta: previa, hayAlgo, pendiente } = useVistaPreviaCotizacion(entrada);
  const datos = hayAlgo ? previa.data : undefined;
  const errorPrevia = hayAlgo ? errorDeConsultas(previa) : null;
  const tasas = datos?.tasas;
  const textoTasas = [
    tasas?.trm ? `TRM ${formatearDecimal(tasas.trm)}` : null,
    tasas?.tasaVes ? `Bs ${formatearDecimal(tasas.tasaVes)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  async function guardar(valores: DatosCotizacion) {
    setErrorGeneral(null);
    setGuardando(true);
    try {
      await alGuardar(valores);
    } catch (e) {
      const error = comoErrorApi(e);
      const campos: Path<EntradaCotizacion>[] = [
        "clienteId",
        "descripcion",
        "manoDeObra",
        "descuentoValor",
        "observaciones",
        ...valores.lineas.flatMap((_, i) =>
          (["cantidad", "precio"] as const).map((c) => `lineas.${String(i)}.${c}` as Path<EntradaCotizacion>),
        ),
      ];
      if (!aplicarErroresDeCampo(error, setError, campos, CODIGOS)) setErrorGeneral(error);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(guardar)} className="flex flex-col gap-6">
      <EncabezadoPagina
        antetitulo={N.encabezado(formatearFecha(hoy), usuario?.nombre ?? "")}
        titulo={titulo}
        subtitulo={consecutivo ?? N.consecutivo}
        acciones={
          <EnlaceBoton a="/cotizaciones" icono={<List aria-hidden size={16} />}>
            {N.verCotizaciones}
          </EnlaceBoton>
        }
      />
      {aviso}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-tinta/70">{N.tipo}</span>
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <Segmentado
              etiqueta={N.tipo}
              valor={field.value}
              opciones={OPCIONES_TIPO}
              alCambiar={field.onChange}
            />
          )}
        />
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[3_1_460px] flex-col gap-6">
          <Seccion numero="01" titulo={N.seccionCliente}>
            <SelectorCliente
              cliente={cliente}
              error={errors.clienteId?.message}
              alElegir={(c) => {
                setCliente(c);
                setValue("clienteId", c.id ?? null);
                clearErrors("clienteId");
              }}
            />
            {instalacion && (
              <AreaTexto
                etiqueta={N.descripcion}
                rows={3}
                maxLength={2000}
                error={errors.descripcion?.message}
                {...register("descripcion")}
              />
            )}
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-tinta/70">{N.validez}</span>
                <Controller
                  control={control}
                  name="validezDias"
                  render={({ field }) => (
                    <Segmentado
                      etiqueta={N.validez}
                      valor={field.value}
                      opciones={OPCIONES_VALIDEZ}
                      alCambiar={field.onChange}
                    />
                  )}
                />
                {datos?.vence && (
                  <span role="status" className="text-xs text-neutro-700">
                    {N.vence(formatearFecha(datos.vence))}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-tinta/70">{N.moneda}</span>
                <Segmentado
                  etiqueta={N.moneda}
                  valor={moneda}
                  opciones={OPCIONES_MONEDA}
                  alCambiar={(valor) => {
                    setValue("moneda", valor);
                    // Un precio pensado en otra moneda no se arrastra: vuelve al sugerido.
                    const conPrecio = getValues("lineas").some((l) => l.precio.trim() !== "");
                    getValues("lineas").forEach((_, i) => {
                      setValue(`lineas.${i}.precio`, "");
                    });
                    setMonedaCambiada(conPrecio);
                  }}
                />
                {textoTasas && <span className="text-xs text-neutro-700">{N.tasas(textoTasas)}</span>}
              </div>
            </div>
            {monedaCambiada && (
              <Alerta tono="aviso" rol="status">
                {TEXTOS_COMERCIAL.material.monedaCambiada}
              </Alerta>
            )}
          </Seccion>

          <Seccion numero="02" titulo={N.seccionItems}>
            <div>
              <SelectorProducto
                excluir={new Set(entrada.lineas.map((l) => l.productoId))}
                alElegir={(p) => {
                  const linea = lineaDeProducto(p, true);
                  if (linea) append(linea);
                }}
              />
            </div>
            {fields.length > 0 && !cliente && (
              <p className="m-0 text-sm text-neutro-700">{TEXTOS_COMERCIAL.material.sinCliente}</p>
            )}
            {fields.length === 0 ? (
              <p
                className={
                  errors.lineas?.message
                    ? "m-0 text-sm font-medium text-peligro-700"
                    : "m-0 text-sm text-neutro-700"
                }
              >
                {errors.lineas?.message ?? N.sinLineas}
              </p>
            ) : (
              <ul aria-label={N.seccionItems} className="m-0 flex list-none flex-col p-0">
                {fields.map((f, i) => (
                  <LineaMaterial
                    key={f.id}
                    linea={entrada.lineas[i] ?? f}
                    previa={datos?.lineas?.find((l) => l.productoId === f.productoId)}
                    moneda={moneda}
                    registroCantidad={register(`lineas.${i}.cantidad`)}
                    registroPrecio={register(`lineas.${i}.precio`)}
                    errores={{
                      cantidad: errors.lineas?.[i]?.cantidad?.message,
                      precio: errors.lineas?.[i]?.precio?.message,
                    }}
                    alQuitar={() => {
                      remove(i);
                    }}
                  />
                ))}
              </ul>
            )}
            <p className="m-0 text-xs text-neutro-700">{N.costosInternos}</p>
          </Seccion>

          <Seccion numero="03" titulo={cliente?.nombre ? N.cobroDe(cliente.nombre) : N.cobro}>
            <div aria-busy={pendiente || previa.isFetching} className="flex flex-col gap-3">
              <ResumenCobro
                resumen={datos?.resumen}
                moneda={moneda}
                {...(instalacion
                  ? {
                      manoDeObra: (
                        <Campo
                          etiqueta={N.manoDeObra}
                          inputMode="decimal"
                          autoComplete="off"
                          ayuda={moneda}
                          error={errors.manoDeObra?.message}
                          {...register("manoDeObra")}
                        />
                      ),
                    }
                  : {})}
                descuento={{
                  tipo: entrada.descuentoTipo,
                  alCambiarTipo: (tipo) => {
                    setValue("descuentoTipo", tipo);
                  },
                  registroValor: register("descuentoValor"),
                  error: errors.descuentoValor?.message,
                }}
                monedasComprobante={{
                  valor: entrada.monedasComprobante,
                  alCambiar: (monedas) => {
                    setValue("monedasComprobante", monedas);
                  },
                }}
                registroObservaciones={register("observaciones")}
                errorObservaciones={errors.observaciones?.message}
              />
              {errorPrevia ? (
                <Alerta tono="peligro" rol="alert">
                  {mensajeDeError(errorPrevia)}
                </Alerta>
              ) : null}
              {(datos?.avisos ?? []).map((a) => (
                <Alerta key={a} tono="aviso" rol="status">
                  {a}
                </Alerta>
              ))}
              {errorGeneral && (
                <Alerta tono="peligro" rol="alert">
                  {mensajeDeError(errorGeneral)}
                </Alerta>
              )}
              <Boton type="submit" variante="primario" bloque ocupado={guardando}>
                {textoGuardar}
              </Boton>
              <p className="m-0 text-center text-xs text-neutro-700">{N.nota}</p>
            </div>
          </Seccion>
        </div>

        {escritorio && (
          <aside className="flex min-w-0 flex-[2_1_360px] flex-col escritorio:sticky escritorio:top-6">
            <VistaPreviaPdf
              empresa={configuracion}
              consecutivo={consecutivo}
              cliente={
                datos?.cliente ??
                (cliente
                  ? {
                      ...(cliente.nombre ? { nombre: cliente.nombre } : {}),
                      ...(cliente.telefono ? { telefono: cliente.telefono } : {}),
                    }
                  : null)
              }
              descripcion={entrada.descripcion}
              previa={datos}
              moneda={moneda}
              monedasComprobante={entrada.monedasComprobante}
            />
          </aside>
        )}
      </div>
    </form>
  );
}
