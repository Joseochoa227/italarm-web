import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { $api } from "@/api/cliente";
import type { ErrorApi } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Casilla } from "@/components/ui/Casilla";
import { EstadoError } from "@/components/ui/EstadoError";
import { Selector } from "@/components/ui/Selector";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { erroresDeCampo, MENSAJES_ERROR } from "@/lib/errores";

import { type DatosProducto, type EntradaProducto, esquemaProducto } from "../schemas/producto";
import { MONEDAS, TEXTOS_PRODUCTOS } from "../textos";

const F = TEXTOS_PRODUCTOS.formulario;
const CAMPOS = [
  "codigo",
  "nombre",
  "marca",
  "modelo",
  "categoriaId",
  "unidadMedidaId",
  "controlaSerial",
  "monedaPrecio",
  "precioInstalador",
  "precioClienteFinal",
  "stockMinimo",
  "descripcion",
] as const;

/**
 * Formulario de producto (3.3, RF-14 a RF-18), para crear y editar.
 * `error` es el último error del guardado: se reparte en los campos (VALIDACION, código duplicado,
 * P-17) o se muestra arriba del botón.
 */
export function FormularioProducto({
  valores,
  edicion,
  ocupado,
  error,
  conflicto,
  alGuardar,
  children,
}: {
  valores: EntradaProducto;
  edicion: boolean;
  ocupado: boolean;
  error: ErrorApi | null;
  conflicto: boolean;
  alGuardar: (datos: DatosProducto) => void;
  /** Contenido extra al final (foto y datos de solo lectura al editar). */
  children?: React.ReactNode;
}) {
  const categorias = $api.useQuery("get", "/api/v1/categorias");
  const unidades = $api.useQuery("get", "/api/v1/unidades-medida");
  const conDecimales = useMemo(
    () => new Set((unidades.data ?? []).filter((u) => u.admiteDecimales).map((u) => String(u.id))),
    [unidades.data],
  );
  const esquema = useMemo(() => esquemaProducto(conDecimales), [conDecimales]);
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<EntradaProducto, unknown, DatosProducto>({ resolver: zodResolver(esquema), values: valores });

  // P-17: el backend dice qué no se pudo cambiar; se muestra en el campo que el usuario cambió.
  const campoBloqueado = dirtyFields.unidadMedidaId ? "unidadMedidaId" : "controlaSerial";
  const delServidor = error
    ? Object.fromEntries(
        erroresDeCampo(error, CAMPOS, {
          PRODUCTO_CODIGO_DUPLICADO: "codigo",
          PRODUCTO_CAMBIO_NO_PERMITIDO: campoBloqueado,
        }).map((e) => [e.campo, e.mensaje]),
      )
    : {};
  const mensaje = (campo: (typeof CAMPOS)[number]) => errors[campo]?.message ?? delServidor[campo];
  const errorGeneral = error && !conflicto && Object.keys(delServidor).length === 0 ? error : null;
  const opcionesCategoria = (categorias.data ?? []).map((c) => ({
    valor: String(c.id),
    etiqueta: c.nombre ?? "",
  }));
  const opcionesUnidad = (unidades.data ?? []).map((u) => ({
    valor: String(u.id),
    etiqueta: `${u.nombre ?? ""} (${u.abreviatura ?? ""})`,
  }));

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((datos) => {
        alGuardar(datos);
      })}
    >
      {conflicto && (
        <Alerta tono="aviso" rol="alert">
          {MENSAJES_ERROR.conflicto}
        </Alerta>
      )}
      <Tarjeta>
        <div className="grid gap-4 escritorio:grid-cols-2">
          <Campo
            etiqueta={F.codigo}
            ayuda={F.codigoAyuda}
            autoCapitalize="characters"
            error={mensaje("codigo")}
            {...register("codigo")}
          />
          <Campo etiqueta={F.nombre} error={mensaje("nombre")} {...register("nombre")} />
          <Campo etiqueta={F.marca} error={mensaje("marca")} {...register("marca")} />
          <Campo etiqueta={F.modelo} error={mensaje("modelo")} {...register("modelo")} />
          <Selector
            etiqueta={F.categoria}
            vacio={F.elegir}
            opciones={opcionesCategoria}
            error={mensaje("categoriaId")}
            {...register("categoriaId")}
          />
          <Selector
            etiqueta={F.unidad}
            vacio={F.elegir}
            opciones={opcionesUnidad}
            error={mensaje("unidadMedidaId")}
            ayuda={edicion ? F.bloqueoMovimientos : undefined}
            {...register("unidadMedidaId")}
          />
        </div>
        <Casilla etiqueta={F.controlaSerial} {...register("controlaSerial")} />
        {mensaje("controlaSerial") && (
          <p className="m-0 text-xs font-medium text-peligro-700" role="alert">
            {mensaje("controlaSerial")}
          </p>
        )}
      </Tarjeta>
      <Tarjeta>
        <div className="grid gap-4 escritorio:grid-cols-3">
          <Selector etiqueta={F.monedaPrecio} opciones={MONEDAS} {...register("monedaPrecio")} />
          <Campo
            etiqueta={F.precioInstalador}
            inputMode="decimal"
            error={mensaje("precioInstalador")}
            {...register("precioInstalador")}
          />
          <Campo
            etiqueta={F.precioClienteFinal}
            inputMode="decimal"
            error={mensaje("precioClienteFinal")}
            {...register("precioClienteFinal")}
          />
          <Campo
            etiqueta={F.stockMinimo}
            inputMode="decimal"
            ayuda={F.stockMinimoAyuda}
            error={mensaje("stockMinimo")}
            {...register("stockMinimo")}
          />
        </div>
        <AreaTexto etiqueta={F.descripcion} error={mensaje("descripcion")} {...register("descripcion")} />
      </Tarjeta>
      {children}
      {errorGeneral && <EstadoError error={errorGeneral} />}
      <Boton type="submit" variante="primario" ocupado={ocupado} className="self-start">
        {F.guardar}
      </Boton>
    </form>
  );
}
