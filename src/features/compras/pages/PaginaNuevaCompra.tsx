import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, Paperclip, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Controller, type Path, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";

import { $api, api } from "@/api/cliente";
import { comoFormulario } from "@/api/archivos";
import { comoErrorApi, errorDeConsultas, type ErrorApi } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { Segmentado } from "@/components/ui/Segmentado";
import { Selector } from "@/components/ui/Selector";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { useSesion } from "@/features/auth/hooks/contextoSesion";
import { SelectorProducto } from "@/features/inventario/components/SelectorProducto";
import { aplicarErroresDeCampo, mensajeDeError } from "@/lib/errores";
import { hoyBogota } from "@/lib/fechas";
import { formatearDecimal, formatearFecha, separarMonedas } from "@/lib/formato";
import { useClaveIdempotencia } from "@/lib/idempotencia";
import { ErrorImagen } from "@/lib/imagen";

import { LineaCompra } from "../components/LineaCompra";
import { prepararFactura, TIPOS_FACTURA } from "../factura";
import { useVistaPreviaCompra } from "../hooks/vistaPrevia";
import {
  type DatosCompra,
  type EntradaCompra,
  esquemaCompra,
  leerCantidad,
  serialesCompletos,
  serialesDeLinea,
} from "../schemas/compra";
import { TEXTOS_COMPRAS } from "../textos";

const N = TEXTOS_COMPRAS.nueva;
const MONEDAS = [
  { valor: "USD", etiqueta: "USD" },
  { valor: "COP", etiqueta: "COP" },
  { valor: "VES", etiqueta: "VES" },
] as const;

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

/** Registrar compra (RF-39 a RF-45): proveedor y factura, productos con vista previa, total y factura. */
export function Component() {
  const hoy = hoyBogota();
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const { clave } = useClaveIdempotencia();
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<ErrorApi | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string>();

  const proveedores = $api.useQuery("get", "/api/v1/proveedores", { params: { query: { size: 100 } } });
  const listaProveedores = proveedores.data?.contenido ?? [];

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<EntradaCompra, unknown, DatosCompra>({
    resolver: zodResolver(esquemaCompra(hoy)),
    defaultValues: { proveedorId: "", numeroFactura: "", moneda: "USD", fecha: hoy, lineas: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "lineas" });
  const [moneda, fecha, lineas, proveedorId] = useWatch({
    control,
    name: ["moneda", "fecha", "lineas", "proveedorId"],
  });
  const proveedor = listaProveedores.find((p) => String(p.id) === proveedorId);
  const { consulta: previa, hayLineas, pendiente } = useVistaPreviaCompra({ fecha, moneda, lineas, hoy });
  const datosPrevia = previa.data;
  const errorPrevia = errorDeConsultas(previa);

  const faltanSeriales = lineas.filter((l) => {
    if (!l.controlaSerial) return false;
    const cantidad = leerCantidad(l.cantidad, l.admiteDecimales);
    return typeof cantidad === "string" && !serialesCompletos(serialesDeLinea(l, cantidad));
  }).length;

  async function guardar(datos: DatosCompra) {
    setErrorGeneral(null);
    setGuardando(true);
    try {
      const { data: compra } = await api.POST("/api/v1/compras", {
        params: { header: { "Idempotency-Key": clave } },
        body: datos,
      });
      const consecutivo = compra?.consecutivo ?? "";
      if (archivo && compra?.id !== undefined) {
        try {
          await api.PUT("/api/v1/compras/{id}/factura", {
            params: { path: { id: compra.id } },
            body: { archivo },
            bodySerializer: comoFormulario,
          });
        } catch {
          avisar({
            titulo: N.registrada(consecutivo),
            descripcion: N.facturaNoSubida,
            tono: "error",
            duracion: Infinity,
          });
        }
      }
      avisar({ titulo: N.registrada(consecutivo) });
      await clienteConsultas.invalidateQueries();
      void navegar(`/compras/${String(compra?.id ?? "")}`, { replace: true });
    } catch (e) {
      const error = comoErrorApi(e);
      const campos: Path<EntradaCompra>[] = [
        "proveedorId",
        "numeroFactura",
        "fecha",
        "moneda",
        ...datos.lineas.flatMap((_, i) =>
          (["cantidad", "costoUnitario", "seriales"] as const).map(
            (c) => `lineas.${String(i)}.${c}` as Path<EntradaCompra>,
          ),
        ),
      ];
      if (!aplicarErroresDeCampo(error, setError, campos, { COMPRA_FECHA_FUTURA: "fecha" })) {
        setErrorGeneral(error);
      }
    } finally {
      setGuardando(false);
    }
  }

  const { principal, otros: equivalentes } = separarMonedas(datosPrevia?.total, moneda);
  const tasas = datosPrevia?.tasas;

  return (
    <form noValidate onSubmit={handleSubmit(guardar)} className="flex flex-col gap-6">
      <EncabezadoPagina
        volver={{ a: "/compras", etiqueta: N.volver }}
        antetitulo={N.encabezado(formatearFecha(hoy), usuario?.nombre ?? "")}
        titulo={N.titulo}
        subtitulo={N.consecutivo}
      />
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_460px] flex-col gap-6">
          <Seccion numero="01" titulo={N.seccionProveedor}>
            {errorDeConsultas(proveedores) ? (
              <EstadoError
                error={errorDeConsultas(proveedores)}
                alReintentar={() => void proveedores.refetch()}
              />
            ) : (
              <Selector
                etiqueta={N.proveedor}
                vacio={N.elegirProveedor}
                opciones={listaProveedores.map((p) => ({ valor: String(p.id), etiqueta: p.nombre ?? "" }))}
                error={errors.proveedorId?.message}
                ayuda={proveedor?.monedaHabitual ? N.sueleFacturar(proveedor.monedaHabitual) : undefined}
                {...register("proveedorId", {
                  onChange: (e: { target: { value: string } }) => {
                    const elegido = listaProveedores.find((p) => String(p.id) === e.target.value);
                    // La moneda se propone según el proveedor y se puede cambiar (RF-40).
                    if (elegido?.monedaHabitual) setValue("moneda", elegido.monedaHabitual);
                  },
                })}
              />
            )}
            <div className="grid gap-4 escritorio:grid-cols-2">
              <Campo
                etiqueta={N.numeroFactura}
                autoComplete="off"
                error={errors.numeroFactura?.message}
                {...register("numeroFactura")}
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
            <div className="flex flex-col gap-1">
              <span className="text-xs text-tinta/70">{N.moneda}</span>
              <Controller
                control={control}
                name="moneda"
                render={({ field }) => (
                  <Segmentado
                    etiqueta={N.moneda}
                    valor={field.value}
                    opciones={MONEDAS}
                    alCambiar={field.onChange}
                  />
                )}
              />
            </div>
            {tasas && (
              <div className="flex items-start gap-3 rounded-md bg-acento-100 px-4 py-3 text-[13px]">
                <Coins aria-hidden size={18} className="shrink-0 text-acento-700" />
                <span>
                  {N.tasas}:{" "}
                  {[
                    tasas.trm && tasas.fechaTrm
                      ? N.trm(formatearDecimal(tasas.trm), formatearFecha(tasas.fechaTrm))
                      : `TRM ${N.sinTasa}`,
                    tasas.tasaVes && tasas.fechaTasaVes
                      ? N.bolivar(formatearDecimal(tasas.tasaVes), formatearFecha(tasas.fechaTasaVes))
                      : `Bolívar ${N.sinTasa}`,
                  ].join(" · ")}
                </span>
              </div>
            )}
          </Seccion>

          <Seccion numero="02" titulo={N.seccionProductos}>
            <div>
              <SelectorProducto
                excluir={new Set(lineas.map((l) => l.productoId))}
                alElegir={(p) => {
                  if (p.id === undefined) return;
                  append({
                    productoId: p.id,
                    nombre: p.nombre ?? "",
                    codigo: p.codigo ?? "",
                    abreviatura: p.unidadMedida?.abreviatura ?? "",
                    admiteDecimales: p.unidadMedida?.admiteDecimales ?? false,
                    controlaSerial: p.controlaSerial ?? false,
                    cantidad: "1",
                    costoUnitario: "",
                    seriales: [],
                  });
                }}
              />
            </div>
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
                  <LineaCompra
                    key={f.id}
                    indice={i}
                    control={control}
                    register={register}
                    errores={errors.lineas}
                    previa={datosPrevia?.lineas?.find((l) => l.productoId === f.productoId)}
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
          aria-label={N.total}
          className="flex min-w-0 flex-[1_1_300px] flex-col escritorio:sticky escritorio:top-6"
        >
          <Tarjeta className="gap-3 shadow-md">
            <h2 className="m-0 text-[22px]">{N.total}</h2>
            <output aria-live="polite" aria-busy={pendiente || previa.isFetching} className="flex flex-col">
              <span className="font-titulo text-[36px] leading-tight font-semibold">
                {hayLineas ? principal : "—"}
              </span>
              {hayLineas && equivalentes && (
                <span className="text-[13px] text-acento-700">{equivalentes}</span>
              )}
            </output>
            {hayLineas && errorPrevia ? (
              <Alerta tono="peligro" rol="alert">
                {mensajeDeError(errorPrevia)}
              </Alerta>
            ) : null}
            {hayLineas &&
              (datosPrevia?.avisos ?? []).map((a) => (
                <Alerta key={a} tono="aviso" rol="status">
                  {a}
                </Alerta>
              ))}
            <div className="flex flex-col gap-1">
              <label className="flex min-h-[64px] cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-divisor px-3 text-center font-mono text-xs text-acento-700 focus-within:outline-2 focus-within:outline-acento">
                <Paperclip aria-hidden size={16} />
                {archivo ? archivo.name : N.factura}
                <input
                  type="file"
                  accept={TIPOS_FACTURA}
                  className="sr-only"
                  aria-label={N.factura}
                  onChange={(e) => {
                    const elegido = e.target.files?.[0];
                    e.target.value = "";
                    if (!elegido) return;
                    setErrorArchivo(undefined);
                    prepararFactura(elegido).then(setArchivo, (error: unknown) => {
                      setArchivo(null);
                      setErrorArchivo(error instanceof ErrorImagen ? error.message : mensajeDeError(error));
                    });
                  }}
                />
              </label>
              {archivo && (
                <Boton
                  variante="fantasma"
                  className="self-start"
                  onClick={() => {
                    setArchivo(null);
                  }}
                >
                  <Trash2 aria-hidden size={16} />
                  {N.quitarFactura}
                </Boton>
              )}
              <span className="text-xs text-neutro-700">{N.facturaAyuda}</span>
              {errorArchivo && (
                <span role="alert" className="text-xs font-medium text-peligro-700">
                  {errorArchivo}
                </span>
              )}
            </div>
            {errorGeneral && (
              <Alerta tono="peligro" rol="alert">
                {mensajeDeError(errorGeneral)}
              </Alerta>
            )}
            {faltanSeriales > 0 && (
              <p className="m-0 text-xs font-medium text-acento-900">{N.faltanSeriales(faltanSeriales)}</p>
            )}
            <Boton type="submit" variante="primario" bloque ocupado={guardando} disabled={faltanSeriales > 0}>
              {N.guardar}
            </Boton>
            <p className="m-0 text-center text-xs text-neutro-700">{N.noSeEdita}</p>
          </Tarjeta>
        </aside>
      </div>
    </form>
  );
}
