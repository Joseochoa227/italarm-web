import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { List } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { type Path, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useSearchParams } from "react-router";

import { $api, api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { comoErrorApi, errorDeConsultas, type ErrorApi } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { EstadoError } from "@/components/ui/EstadoError";
import { Segmentado } from "@/components/ui/Segmentado";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { useSesion } from "@/features/auth/hooks/contextoSesion";
import { LineaMaterial } from "@/features/comercial/components/LineaMaterial";
import { ResumenCobro } from "@/features/comercial/components/ResumenCobro";
import { type Cliente, SelectorCliente } from "@/features/comercial/components/SelectorCliente";
import { lineaDeProducto, MONEDAS } from "@/features/comercial/schemas/material";
import { TEXTOS_COMERCIAL } from "@/features/comercial/textos";
import { useConfiguracion } from "@/features/configuracion/hooks/configuracion";
import { SelectorProducto } from "@/features/inventario/components/SelectorProducto";
import { aplicarErroresDeCampo, mensajeDeError } from "@/lib/errores";
import { hoyBogota } from "@/lib/fechas";
import { formatearDecimal, formatearFecha } from "@/lib/formato";
import { useClaveIdempotencia } from "@/lib/idempotencia";

import { ConfirmacionInstalacion, type ProgresoFotos } from "../components/ConfirmacionInstalacion";
import { GaleriaFotos } from "../components/GaleriaFotos";
import { SelectorTecnicos } from "../components/SelectorTecnicos";
import { type FotoGaleria, type GrupoFoto, GRUPOS, subirFoto } from "../fotos";
import { useVistaPreviaInstalacion } from "../hooks/vistaPrevia";
import {
  type DatosInstalacion,
  type EntradaInstalacion,
  esquemaInstalacion,
  MESES_GARANTIA,
} from "../schemas/instalacion";
import { TEXTOS_INSTALACIONES } from "../textos";

const N = TEXTOS_INSTALACIONES.nueva;
const OPCIONES_MONEDA = MONEDAS.map((m) => ({ valor: m, etiqueta: m }));
const OPCIONES_MESES = MESES_GARANTIA.map((m) => ({ valor: m, etiqueta: N.meses(Number(m)) }));
const CODIGOS: Partial<Record<string, Path<EntradaInstalacion>>> = {
  CLIENTE_NO_EXISTE: "clienteId",
  INSTALACION_SIN_DIRECCION: "direccion",
  INSTALACION_FECHA_FUTURA: "fecha",
  INSTALACION_SIN_TECNICOS: "tecnicos",
  INSTALACION_SIN_DESCRIPCION: "descripcion",
  INSTALACION_VACIA: "manoDeObra",
  INSTALACION_GARANTIA_INVALIDA: "garantiaManoObraMeses",
  DESCUENTO_INVALIDO: "descuentoValor",
};
type Instalacion = components["schemas"]["InstalacionVista"];
type FotoLocal = FotoGaleria & { archivo: File };
type FotosLocales = Record<GrupoFoto, FotoLocal[]>;
const SIN_FOTOS: FotosLocales = { ANTES: [], DURANTE: [], DESPUES: [] };

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

function FormularioInstalacion({
  clienteInicial,
  configuracion,
  alGuardar,
}: {
  clienteInicial: Cliente | null;
  configuracion: components["schemas"]["ConfiguracionVista"] | undefined;
  alGuardar: (instalacion: Instalacion, fotos: FotosLocales) => void;
}) {
  const hoy = hoyBogota();
  const { usuario } = useSesion();
  const clienteConsultas = useQueryClient();
  const { clave } = useClaveIdempotencia();
  const [cliente, setCliente] = useState<Cliente | null>(clienteInicial);
  const [fotos, setFotos] = useState<FotosLocales>(SIN_FOTOS);
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<ErrorApi | null>(null);
  const [monedaCambiada, setMonedaCambiada] = useState(false);
  const meses = String(configuracion?.garantiaManoObraMeses ?? 3);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<EntradaInstalacion, unknown, DatosInstalacion>({
    resolver: zodResolver(esquemaInstalacion(hoy)),
    defaultValues: {
      clienteId: clienteInicial?.id ?? null,
      direccion: clienteInicial?.direccion ?? "",
      fecha: hoy,
      tecnicos: usuario?.id === undefined ? [] : [usuario.id],
      descripcion: "",
      lineas: [],
      moneda: "USD",
      manoDeObra: "",
      garantiaManoObraMeses: (MESES_GARANTIA as readonly string[]).includes(meses)
        ? (meses as (typeof MESES_GARANTIA)[number])
        : "3",
      condicionesGarantia: configuracion?.condicionesGarantia ?? "",
      descuentoTipo: "NINGUNO",
      descuentoValor: "",
      monedasComprobante: [],
      observaciones: "",
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "lineas" });
  const entrada = useWatch({ control }) as EntradaInstalacion;
  const moneda = entrada.moneda;
  const { consulta: previa, hayAlgo, pendiente } = useVistaPreviaInstalacion(entrada, hoy);
  const datos = hayAlgo ? previa.data : undefined;
  const errorPrevia = hayAlgo ? errorDeConsultas(previa) : null;
  const sinStock = datos?.puedeGuardar === false;
  const tasas = datos?.tasas;

  // Las vistas de las fotos elegidas se liberan al salir del formulario.
  useEffect(
    () => () => {
      GRUPOS.forEach((g) => {
        fotos[g].forEach((f) => {
          URL.revokeObjectURL(f.url);
        });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al desmontar
    [],
  );

  async function guardar(valores: DatosInstalacion) {
    setErrorGeneral(null);
    setGuardando(true);
    try {
      const { data } = await api.POST("/api/v1/instalaciones", {
        params: { header: { "Idempotency-Key": clave } },
        body: valores,
      });
      await clienteConsultas.invalidateQueries();
      if (data) alGuardar(data, fotos);
    } catch (e) {
      const error = comoErrorApi(e);
      const campos: Path<EntradaInstalacion>[] = [
        "clienteId",
        "direccion",
        "fecha",
        "tecnicos",
        "descripcion",
        "manoDeObra",
        "garantiaManoObraMeses",
        "condicionesGarantia",
        "descuentoValor",
        "observaciones",
        ...valores.lineas.flatMap((_, i) =>
          (["cantidad", "precio", "seriales"] as const).map(
            (c) => `lineas.${String(i)}.${c}` as Path<EntradaInstalacion>,
          ),
        ),
      ];
      if (!aplicarErroresDeCampo(error, setError, campos, CODIGOS)) setErrorGeneral(error);
    } finally {
      setGuardando(false);
    }
  }

  const textoTasas = [
    tasas?.trm
      ? `TRM ${formatearDecimal(tasas.trm)}${tasas.fechaTrm ? ` (${formatearFecha(tasas.fechaTrm)})` : ""}`
      : null,
    tasas?.tasaVes
      ? `Bs ${formatearDecimal(tasas.tasaVes)}${tasas.fechaTasaVes ? ` (${formatearFecha(tasas.fechaTasaVes)})` : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <form noValidate onSubmit={handleSubmit(guardar)} className="flex flex-col gap-6">
      <EncabezadoPagina
        antetitulo={N.encabezado(formatearFecha(hoy), usuario?.nombre ?? "")}
        titulo={N.titulo}
        subtitulo={N.consecutivo}
        acciones={
          <EnlaceBoton a="/instalaciones" icono={<List aria-hidden size={16} />}>
            {N.verInstalaciones}
          </EnlaceBoton>
        }
      />
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_460px] flex-col gap-6">
          <Seccion numero="01" titulo={N.seccionCliente}>
            <SelectorCliente
              cliente={cliente}
              error={errors.clienteId?.message}
              alElegir={(c) => {
                // La dirección se propone desde el cliente, salvo que ya se haya escrito otra.
                const anterior = cliente?.direccion ?? "";
                if (getValues("direccion").trim() === "" || getValues("direccion") === anterior) {
                  setValue("direccion", c.direccion ?? "");
                }
                setCliente(c);
                setValue("clienteId", c.id ?? null);
                clearErrors("clienteId");
              }}
            />
            <div className="grid gap-4 escritorio:grid-cols-[2fr_1fr]">
              <Campo
                etiqueta={N.direccion}
                ayuda={N.direccionAyuda}
                autoComplete="off"
                error={errors.direccion?.message}
                {...register("direccion")}
              />
              <Campo
                etiqueta={N.fecha}
                type="date"
                max={hoy}
                ayuda={N.fechaAyuda}
                error={errors.fecha?.message}
                {...register("fecha")}
              />
            </div>
            <SelectorTecnicos
              valor={entrada.tecnicos}
              error={errors.tecnicos?.message}
              alCambiar={(tecnicos) => {
                setValue("tecnicos", tecnicos);
                clearErrors("tecnicos");
              }}
            />
            <AreaTexto
              etiqueta={N.descripcion}
              rows={3}
              maxLength={2000}
              error={errors.descripcion?.message}
              {...register("descripcion")}
            />
          </Seccion>

          <Seccion numero="02" titulo={N.seccionMaterial}>
            <div>
              <SelectorProducto
                excluir={new Set(entrada.lineas.map((l) => l.productoId))}
                alElegir={(p) => {
                  const linea = lineaDeProducto(p);
                  if (linea) append(linea);
                }}
              />
            </div>
            {fields.length > 0 && !cliente && (
              <p className="m-0 text-sm text-neutro-700">{TEXTOS_COMERCIAL.material.sinCliente}</p>
            )}
            {fields.length === 0 ? (
              <p className="m-0 text-sm text-neutro-700">{N.sinLineas}</p>
            ) : (
              <ul aria-label={N.seccionMaterial} className="m-0 flex list-none flex-col p-0">
                {fields.map((f, i) => (
                  <LineaMaterial
                    key={f.id}
                    linea={entrada.lineas[i] ?? f}
                    previa={datos?.lineas?.find((l) => l.productoId === f.productoId)}
                    moneda={moneda}
                    registroCantidad={register(`lineas.${i}.cantidad`)}
                    registroPrecio={register(`lineas.${i}.precio`)}
                    seriales={{
                      valor: entrada.lineas[i]?.seriales ?? [],
                      alCambiar: (seriales) => {
                        setValue(`lineas.${i}.seriales`, seriales);
                        clearErrors(`lineas.${i}.seriales`);
                      },
                    }}
                    errores={{
                      cantidad: errors.lineas?.[i]?.cantidad?.message,
                      precio: errors.lineas?.[i]?.precio?.message,
                      seriales: errors.lineas?.[i]?.seriales?.message,
                    }}
                    alQuitar={() => {
                      remove(i);
                    }}
                  />
                ))}
              </ul>
            )}
          </Seccion>

          <Seccion numero="03" titulo={N.seccionFotos}>
            <p className="m-0 text-sm text-neutro-700">{N.fotosAyuda}</p>
            <GaleriaFotos
              fotos={fotos}
              alAgregar={(grupo, archivos) => {
                setFotos((actuales) => ({
                  ...actuales,
                  [grupo]: [
                    ...actuales[grupo],
                    ...archivos.map((archivo) => ({
                      clave: crypto.randomUUID(),
                      url: URL.createObjectURL(archivo),
                      archivo,
                    })),
                  ],
                }));
                return Promise.resolve();
              }}
              alQuitar={(grupo, foto) => {
                URL.revokeObjectURL(foto.url);
                setFotos((actuales) => ({
                  ...actuales,
                  [grupo]: actuales[grupo].filter((f) => f.clave !== foto.clave),
                }));
                return Promise.resolve();
              }}
            />
          </Seccion>

          <Seccion numero="04" titulo={N.seccionGarantia}>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-tinta/70">{N.manoObraMeses}</span>
              <Segmentado
                etiqueta={N.manoObraMeses}
                valor={entrada.garantiaManoObraMeses}
                opciones={OPCIONES_MESES}
                alCambiar={(valor) => {
                  setValue("garantiaManoObraMeses", valor);
                }}
              />
              {errors.garantiaManoObraMeses?.message && (
                <p role="alert" className="m-0 text-xs font-medium text-peligro-700">
                  {errors.garantiaManoObraMeses.message}
                </p>
              )}
            </div>
            <div role="status" className="flex flex-col gap-0.5 text-sm">
              {datos?.garantias?.venceManoObra && (
                <strong>{N.venceManoObra(formatearFecha(datos.garantias.venceManoObra))}</strong>
              )}
              {datos?.garantias?.venceEquipos && (
                <span>{N.venceEquipos(formatearFecha(datos.garantias.venceEquipos))}</span>
              )}
              <span className="text-xs text-neutro-700">{N.garantiaNota}</span>
            </div>
            <AreaTexto
              etiqueta={N.condiciones}
              rows={2}
              maxLength={2000}
              error={errors.condicionesGarantia?.message}
              {...register("condicionesGarantia")}
            />
          </Seccion>
        </div>

        <aside
          aria-label={N.cobro}
          className="flex min-w-0 flex-[1_1_300px] flex-col escritorio:sticky escritorio:top-6"
        >
          <Tarjeta className="gap-3 shadow-md" aria-busy={pendiente || previa.isFetching}>
            <h2 className="m-0 text-[22px]">{cliente?.nombre ? N.cobroDe(cliente.nombre) : N.cobro}</h2>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-tinta/70">{N.moneda}</span>
              <Segmentado
                etiqueta={N.moneda}
                valor={moneda}
                opciones={OPCIONES_MONEDA}
                alCambiar={(valor) => {
                  setValue("moneda", valor);
                  const conPrecio = getValues("lineas").some((l) => l.precio.trim() !== "");
                  getValues("lineas").forEach((_, i) => {
                    setValue(`lineas.${i}.precio`, "");
                  });
                  setMonedaCambiada(conPrecio);
                }}
              />
              {textoTasas && <p className="m-0 text-xs text-neutro-700">{N.tasas(textoTasas)}</p>}
            </div>
            {monedaCambiada && (
              <Alerta tono="aviso" rol="status">
                {TEXTOS_COMERCIAL.material.monedaCambiada}
              </Alerta>
            )}
            <ResumenCobro
              resumen={datos?.resumen}
              moneda={moneda}
              manoDeObra={
                <Campo
                  etiqueta={N.manoDeObra}
                  inputMode="decimal"
                  autoComplete="off"
                  ayuda={moneda}
                  error={errors.manoDeObra?.message}
                  {...register("manoDeObra")}
                />
              }
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
            {sinStock && (
              <Alerta tono="peligro" rol="alert">
                {TEXTOS_COMERCIAL.cobro.sinStock}
              </Alerta>
            )}
            {errorGeneral && (
              <Alerta tono="peligro" rol="alert">
                {mensajeDeError(errorGeneral)}
              </Alerta>
            )}
            <Boton type="submit" variante="primario" bloque ocupado={guardando} disabled={sinStock}>
              {N.guardar}
            </Boton>
            <p className="m-0 text-center text-xs text-neutro-700">{N.nota}</p>
          </Tarjeta>
        </aside>
      </div>
    </form>
  );
}

/** Nueva instalación (RF-107 a RF-120). Con `?clienteId=` llega con el cliente elegido. */
export function Component() {
  const [parametros] = useSearchParams();
  const clienteId = Number(parametros.get("clienteId") ?? "");
  const conCliente = Number.isInteger(clienteId) && clienteId > 0;
  const cliente = $api.useQuery(
    "get",
    "/api/v1/clientes/{id}",
    { params: { path: { id: clienteId } } },
    { enabled: conCliente },
  );
  const configuracion = useConfiguracion();
  const [guardada, setGuardada] = useState<Instalacion | null>(null);
  const [progreso, setProgreso] = useState<ProgresoFotos>({ total: 0, subidas: 0, fallidas: 0 });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [guardada]);

  async function subirFotos(id: number, fotos: FotosLocales) {
    const lista = GRUPOS.flatMap((g) => fotos[g].map((f) => ({ grupo: g, archivo: f.archivo })));
    setProgreso({ total: lista.length, subidas: 0, fallidas: 0 });
    // Una por una, para no saturar una conexión lenta del celular.
    for (const { grupo, archivo } of lista) {
      const resultado = await subirFoto(id, grupo, archivo).then(
        () => "subidas" as const,
        () => "fallidas" as const,
      );
      setProgreso((p) => ({ ...p, [resultado]: p[resultado] + 1 }));
    }
  }

  if (guardada) {
    return (
      <ConfirmacionInstalacion
        instalacion={guardada}
        fotos={progreso}
        alRegistrarOtra={() => {
          setGuardada(null);
          setProgreso({ total: 0, subidas: 0, fallidas: 0 });
          setIntento((n) => n + 1);
        }}
      />
    );
  }
  const error = errorDeConsultas(configuracion);
  if (error) return <EstadoError error={error} alReintentar={() => void configuracion.refetch()} />;
  // Se espera al cliente de la URL y a la Configuración para montar el formulario con sus valores.
  if ((conCliente && cliente.isPending) || configuracion.isPending) return <CargandoLista filas={4} />;
  return (
    <FormularioInstalacion
      key={intento}
      clienteInicial={intento === 0 ? (cliente.data ?? null) : null}
      configuracion={configuracion.data}
      alGuardar={(instalacion, fotos) => {
        setGuardada(instalacion);
        if (instalacion.id !== undefined) void subirFotos(instalacion.id, fotos);
      }}
    />
  );
}
