import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router";

import { $api, api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { comoErrorApi, errorDeConsultas, type ErrorApi } from "@/api/problema";
import { CampoSeriales } from "@/components/seriales/CampoSeriales";
import { Alerta } from "@/components/ui/Alerta";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { Segmentado } from "@/components/ui/Segmentado";
import { Selector } from "@/components/ui/Selector";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { aplicarErroresDeCampo, mensajeDeError } from "@/lib/errores";
import { formatearCantidad, formatearDineroDe } from "@/lib/formato";
import { useClaveIdempotencia } from "@/lib/idempotencia";
import { ajustarSeriales, unidadesDe } from "@/lib/seriales";

import { SelectorSerialesBodega } from "../components/SelectorSerialesBodega";
import {
  cantidadDe,
  type ContextoAjuste,
  type DatosAjuste,
  type EntradaAjuste,
  esquemaAjuste,
  MOTIVOS,
  nuevoStock,
} from "../schemas/ajuste";
import { TEXTOS_INVENTARIO } from "../textosInventario";

const A = TEXTOS_INVENTARIO.ajuste;
const TIPOS = [
  { valor: "ENTRADA", etiqueta: A.entrada },
  { valor: "SALIDA", etiqueta: A.salida },
] as const;
const CAMPOS = ["motivo", "descripcion", "cantidad", "costoUnitarioUsd", "seriales"] as const;
const CODIGOS = {
  STOCK_INSUFICIENTE: "cantidad",
  CANTIDAD_INVALIDA: "cantidad",
  COSTO_REQUERIDO: "costoUnitarioUsd",
  SERIAL_NO_DISPONIBLE: "seriales",
  SERIAL_DUPLICADO: "seriales",
  SERIAL_INVALIDO: "seriales",
  SERIALES_NO_COINCIDEN: "seriales",
} as const;

function FormularioAjuste({
  producto,
  contexto,
}: {
  producto: components["schemas"]["ProductoInventarioVista"];
  contexto: ContextoAjuste;
}) {
  const id = producto.id ?? 0;
  const unidad = producto.abreviatura ?? "";
  const navegar = useNavigate();
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const { clave } = useClaveIdempotencia();
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<ErrorApi | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<EntradaAjuste, unknown, DatosAjuste>({
    resolver: zodResolver(esquemaAjuste(contexto)),
    defaultValues: {
      tipo: "ENTRADA",
      motivo: "CONTEO_FISICO",
      descripcion: "",
      cantidad: "",
      costoUnitarioUsd: "",
      seriales: [],
    },
  });
  const entrada = useWatch({ control }) as EntradaAjuste;
  const cantidad = cantidadDe(entrada, contexto);
  const previa = typeof cantidad === "string" ? nuevoStock(contexto.stock, entrada.tipo, cantidad) : null;
  const conSerialEntrada = contexto.controlaSerial && entrada.tipo === "ENTRADA";
  const conSerialSalida = contexto.controlaSerial && entrada.tipo === "SALIDA";
  const costoVigente = producto.costoActual?.usd;

  async function guardar(datos: DatosAjuste) {
    setErrorGeneral(null);
    setGuardando(true);
    try {
      const { data } = await api.POST("/api/v1/ajustes", {
        params: { header: { "Idempotency-Key": clave } },
        body: { productoId: id, ...datos },
      });
      avisar({ titulo: A.registrado(data?.consecutivo ?? "") });
      await clienteConsultas.invalidateQueries();
      void navegar(`/inventario/ajustes/${String(data?.id ?? "")}`, { replace: true });
    } catch (e) {
      const error = comoErrorApi(e);
      if (!aplicarErroresDeCampo(error, setError, CAMPOS, CODIGOS)) setErrorGeneral(error);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(guardar)} className="flex flex-col gap-4">
      <Tarjeta className="gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-tinta/70">{A.tipo}</span>
          <Controller
            control={control}
            name="tipo"
            render={({ field }) => (
              <Segmentado
                etiqueta={A.tipo}
                valor={field.value}
                opciones={TIPOS}
                alCambiar={(valor) => {
                  field.onChange(valor);
                  setValue("seriales", []);
                }}
              />
            )}
          />
        </div>
        <div className="grid gap-4 escritorio:grid-cols-2">
          <Selector
            etiqueta={A.motivo}
            opciones={MOTIVOS.map((m) => ({ valor: m, etiqueta: A.motivos[m] }))}
            error={errors.motivo?.message}
            {...register("motivo")}
          />
          {!conSerialSalida && (
            <Campo
              etiqueta={A.cantidad}
              inputMode={contexto.admiteDecimales ? "decimal" : "numeric"}
              autoComplete="off"
              ayuda={unidad}
              error={errors.cantidad?.message}
              {...register("cantidad")}
            />
          )}
        </div>
        <AreaTexto
          etiqueta={A.descripcion}
          ayuda={A.descripcionOtro}
          maxLength={300}
          error={errors.descripcion?.message}
          {...register("descripcion")}
        />
        {entrada.tipo === "ENTRADA" &&
          (contexto.sinCosto ? (
            <Campo
              etiqueta={A.costo}
              inputMode="decimal"
              autoComplete="off"
              ayuda={A.costoAyuda}
              error={errors.costoUnitarioUsd?.message}
              {...register("costoUnitarioUsd")}
            />
          ) : (
            costoVigente && <Alerta tono="info">{A.costoVigente(formatearDineroDe(costoVigente))}</Alerta>
          ))}
        {conSerialEntrada && typeof cantidad === "string" && unidadesDe(cantidad) > 0 && (
          <Controller
            control={control}
            name="seriales"
            render={({ field }) => (
              <CampoSeriales
                producto={producto.nombre ?? ""}
                valores={ajustarSeriales(field.value, unidadesDe(cantidad))}
                alCambiar={field.onChange}
                error={errors.seriales?.message}
              />
            )}
          />
        )}
        {conSerialSalida && (
          <Controller
            control={control}
            name="seriales"
            render={({ field }) => (
              <SelectorSerialesBodega
                productoId={id}
                seleccionados={field.value}
                alCambiar={field.onChange}
                error={errors.seriales?.message}
              />
            )}
          />
        )}
      </Tarjeta>
      <div role="status" className="flex flex-wrap items-center gap-3 text-sm">
        {previa &&
          (previa.insuficiente ? (
            <strong className="text-peligro-700">
              {A.stockInsuficiente(`${formatearCantidad(contexto.stock)} ${unidad}`)}
            </strong>
          ) : (
            <strong>
              {A.nuevoStock(
                `${formatearCantidad(contexto.stock)} ${unidad}`,
                `${formatearCantidad(previa.resultado)} ${unidad}`,
              )}
            </strong>
          ))}
      </div>
      {errorGeneral && (
        <Alerta tono="peligro" rol="alert">
          {mensajeDeError(errorGeneral)}
        </Alerta>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Boton type="submit" variante="primario" ocupado={guardando} disabled={previa?.insuficiente === true}>
          {A.guardar}
        </Boton>
        <span className="flex-[1_1_240px] text-xs text-neutro-700">{A.noSeAnula}</span>
      </div>
    </form>
  );
}

/** Ajuste de inventario de un producto (RF-58 a RF-62, P-24, P-25). */
export function Component() {
  const id = Number(useParams().id);
  const producto = $api.useQuery("get", "/api/v1/inventario/productos/{id}", { params: { path: { id } } });
  // La unidad (si admite decimales) está en el catálogo (P-09).
  const catalogo = $api.useQuery("get", "/api/v1/productos/{id}", { params: { path: { id } } });
  const error = errorDeConsultas(producto, catalogo);
  if (error) {
    return (
      <EstadoError
        error={error}
        alReintentar={() => {
          void producto.refetch();
          void catalogo.refetch();
        }}
      />
    );
  }
  const p = producto.data;
  const c = catalogo.data;
  if (!p || !c) return <CargandoLista filas={4} />;

  return (
    <>
      <EncabezadoPagina
        volver={{ a: `/inventario/productos/${String(id)}`, etiqueta: p.nombre ?? "" }}
        antetitulo={p.codigo}
        titulo={A.titulo}
        subtitulo={`${p.nombre ?? ""} · ${TEXTOS_INVENTARIO.detalle.stock}: ${formatearCantidad(p.stock ?? "0")} ${p.abreviatura ?? ""}`}
      />
      <FormularioAjuste
        producto={p}
        contexto={{
          admiteDecimales: c.unidadMedida?.admiteDecimales ?? false,
          controlaSerial: p.controlaSerial ?? false,
          sinCosto: !p.costoActual?.usd,
          stock: p.stock ?? "0",
        }}
      />
    </>
  );
}
