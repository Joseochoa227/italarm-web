import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { List } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Controller, type Path, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useSearchParams } from "react-router";

import { $api, api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { comoErrorApi, errorDeConsultas, type ErrorApi } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { Segmentado } from "@/components/ui/Segmentado";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { useSesion } from "@/features/auth/hooks/contextoSesion";
import { type Cliente, SelectorCliente } from "@/features/comercial/components/SelectorCliente";
import { SelectorProducto } from "@/features/inventario/components/SelectorProducto";
import { aplicarErroresDeCampo, mensajeDeError } from "@/lib/errores";
import { hoyBogota } from "@/lib/fechas";
import { formatearDecimal, formatearFecha } from "@/lib/formato";
import { useClaveIdempotencia } from "@/lib/idempotencia";

import { ConfirmacionVenta } from "../components/ConfirmacionVenta";
import { LineaVenta } from "../components/LineaVenta";
import { ResumenVenta } from "../components/ResumenVenta";
import { useVistaPreviaVenta } from "../hooks/vistaPrevia";
import { type DatosVenta, type EntradaVenta, esquemaVenta, MONEDAS } from "../schemas/venta";
import { TEXTOS_VENTAS } from "../textos";

const N = TEXTOS_VENTAS.nueva;
const OPCIONES_MONEDA = MONEDAS.map((m) => ({ valor: m, etiqueta: m }));
const VACIA: EntradaVenta = {
  clienteId: null,
  moneda: "USD",
  lineas: [],
  descuentoTipo: "NINGUNO",
  descuentoValor: "",
  monedasComprobante: [],
  observaciones: "",
};
const CODIGOS: Partial<Record<string, Path<EntradaVenta>>> = {
  DESCUENTO_INVALIDO: "descuentoValor",
  CLIENTE_NO_EXISTE: "clienteId",
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

/** Tasas del día que quedarán guardadas con la venta (RF-98). */
function TasasDelDia() {
  const vigentes = $api.useQuery("get", "/api/v1/tasas/vigentes");
  const trm = vigentes.data?.trm?.valor;
  const bolivar = vigentes.data?.bolivar?.valor;
  if (!trm && !bolivar) return null;
  const texto = [
    trm ? N.trm(formatearDecimal(trm)) : null,
    bolivar ? N.bolivar(formatearDecimal(bolivar)) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return <p className="m-0 text-xs text-neutro-700">{N.tasas(texto)}</p>;
}

function FormularioVenta({
  clienteInicial,
  alGuardar,
}: {
  clienteInicial: Cliente | null;
  alGuardar: (venta: components["schemas"]["VentaVista"]) => void;
}) {
  const hoy = hoyBogota();
  const { usuario } = useSesion();
  const clienteConsultas = useQueryClient();
  const { clave } = useClaveIdempotencia();
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
  } = useForm<EntradaVenta, unknown, DatosVenta>({
    resolver: zodResolver(esquemaVenta),
    defaultValues: { ...VACIA, clienteId: clienteInicial?.id ?? null },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "lineas" });
  const entrada = useWatch({ control }) as EntradaVenta;
  const moneda = entrada.moneda;
  const { consulta: previa, hayLineas, pendiente } = useVistaPreviaVenta(entrada);
  const datos = hayLineas ? previa.data : undefined;
  const errorPrevia = hayLineas ? errorDeConsultas(previa) : null;
  const sinStock = datos?.puedeGuardar === false;

  async function guardar(valores: DatosVenta) {
    setErrorGeneral(null);
    setGuardando(true);
    try {
      const { data } = await api.POST("/api/v1/ventas", {
        params: { header: { "Idempotency-Key": clave } },
        body: valores,
      });
      await clienteConsultas.invalidateQueries();
      if (data) alGuardar(data);
    } catch (e) {
      const error = comoErrorApi(e);
      const campos: Path<EntradaVenta>[] = [
        "clienteId",
        "descuentoValor",
        "observaciones",
        ...valores.lineas.flatMap((_, i) =>
          (["cantidad", "precio", "seriales"] as const).map(
            (c) => `lineas.${String(i)}.${c}` as Path<EntradaVenta>,
          ),
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
        titulo={N.titulo}
        subtitulo={N.consecutivo}
        acciones={
          <EnlaceBoton a="/ventas" icono={<List aria-hidden size={16} />}>
            {N.verVentas}
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
                setCliente(c);
                setValue("clienteId", c.id ?? null);
                clearErrors("clienteId");
              }}
            />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-tinta/70">{N.moneda}</span>
              <Controller
                control={control}
                name="moneda"
                render={({ field }) => (
                  <Segmentado
                    etiqueta={N.moneda}
                    valor={field.value}
                    opciones={OPCIONES_MONEDA}
                    alCambiar={(valor) => {
                      field.onChange(valor);
                      // Un precio pensado en otra moneda no se arrastra: vuelve al sugerido.
                      const conPrecio = getValues("lineas").some((l) => l.precio.trim() !== "");
                      getValues("lineas").forEach((_, i) => {
                        setValue(`lineas.${i}.precio`, "");
                      });
                      setMonedaCambiada(conPrecio);
                    }}
                  />
                )}
              />
              <TasasDelDia />
            </div>
            {monedaCambiada && (
              <Alerta tono="aviso" rol="status">
                {N.monedaCambiada}
              </Alerta>
            )}
          </Seccion>

          <Seccion numero="02" titulo={N.seccionProductos}>
            <div>
              <SelectorProducto
                excluir={new Set(entrada.lineas.map((l) => l.productoId))}
                alElegir={(p) => {
                  if (p.id === undefined) return;
                  append({
                    productoId: p.id,
                    nombre: p.nombre ?? "",
                    codigo: p.codigo ?? "",
                    abreviatura: p.unidadMedida?.abreviatura ?? "",
                    admiteDecimales: p.unidadMedida?.admiteDecimales ?? false,
                    controlaSerial: p.controlaSerial ?? false,
                    cantidad: p.controlaSerial ? "" : "1",
                    precio: "",
                    seriales: [],
                  });
                }}
              />
            </div>
            {fields.length > 0 && !cliente && <p className="m-0 text-sm text-neutro-700">{N.sinCliente}</p>}
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
              <ul aria-label={N.seccionProductos} className="m-0 flex list-none flex-col p-0">
                {fields.map((f, i) => (
                  <LineaVenta
                    key={f.id}
                    indice={i}
                    control={control}
                    register={register}
                    errores={errors.lineas}
                    previa={datos?.lineas?.find((l) => l.productoId === f.productoId)}
                    moneda={moneda}
                    alQuitar={() => {
                      remove(i);
                    }}
                  />
                ))}
              </ul>
            )}
          </Seccion>
        </div>

        <aside
          aria-label={N.resumen}
          className="flex min-w-0 flex-[1_1_300px] flex-col escritorio:sticky escritorio:top-6"
        >
          <Tarjeta className="gap-3 shadow-md" aria-busy={pendiente || previa.isFetching}>
            <h2 className="m-0 text-[22px]">{cliente?.nombre ? N.resumenDe(cliente.nombre) : N.resumen}</h2>
            <ResumenVenta
              resumen={datos?.resumen}
              moneda={moneda}
              control={control}
              register={register}
              errores={errors}
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
                {N.sinStock}
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

/** Nueva venta (RF-97 a RF-104). Con `?clienteId=` llega con el cliente elegido. */
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
  const [guardada, setGuardada] = useState<components["schemas"]["VentaVista"] | null>(null);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [guardada]);

  if (guardada) {
    return (
      <ConfirmacionVenta
        venta={guardada}
        alRegistrarOtra={() => {
          setGuardada(null);
          setIntento((n) => n + 1);
        }}
      />
    );
  }
  // Se espera al cliente de la URL para montar el formulario con él (defaultValues).
  if (conCliente && cliente.isPending) return null;
  return (
    <FormularioVenta
      // Otra venta: formulario vacío y una clave de idempotencia nueva.
      key={intento}
      clienteInicial={intento === 0 ? (cliente.data ?? null) : null}
      alGuardar={setGuardada}
    />
  );
}
