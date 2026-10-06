import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import type { ErrorApi } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { EstadoError } from "@/components/ui/EstadoError";
import { Selector } from "@/components/ui/Selector";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { erroresDeCampo, MENSAJES_ERROR } from "@/lib/errores";

import { type DatosCliente, type EntradaCliente, esquemaCliente } from "../schemas/cliente";
import { TEXTOS_CLIENTES } from "../textos";

const T = TEXTOS_CLIENTES;
const F = T.formulario;
const CAMPOS = [
  "tipo",
  "nombre",
  "tipoDocumento",
  "numeroDocumento",
  "telefono",
  "correo",
  "direccion",
  "ciudad",
] as const;
const POR_CODIGO = { CLIENTE_DOCUMENTO_DUPLICADO: "numeroDocumento", TELEFONO_INVALIDO: "telefono" } as const;
const TIPOS = [
  { valor: "CLIENTE_FINAL", etiqueta: T.tipos.CLIENTE_FINAL },
  { valor: "INSTALADOR", etiqueta: T.tipos.INSTALADOR },
] as const;
const DOCUMENTOS = [
  { valor: "", etiqueta: F.sinDocumento },
  { valor: "CC", etiqueta: "CC" },
  { valor: "NIT", etiqueta: "NIT" },
] as const;

/**
 * Formulario de cliente (RF-75). Se usa en sus pantallas y, desde la Fase 3, dentro de un diálogo en
 * los formularios de venta, instalación y cotización (RF-79).
 */
export function FormularioCliente({
  valores,
  ocupado,
  error,
  conflicto = false,
  alGuardar,
}: {
  valores: EntradaCliente;
  ocupado: boolean;
  error: ErrorApi | null;
  conflicto?: boolean;
  alGuardar: (datos: DatosCliente) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EntradaCliente, unknown, DatosCliente>({
    resolver: zodResolver(esquemaCliente),
    values: valores,
  });
  const tipo = useWatch({ control, name: "tipo" });

  const delServidor = error
    ? Object.fromEntries(erroresDeCampo(error, CAMPOS, POR_CODIGO).map((e) => [e.campo, e.mensaje]))
    : {};
  const mensaje = (campo: (typeof CAMPOS)[number]) => errors[campo]?.message ?? delServidor[campo];
  const errorGeneral = error && !conflicto && Object.keys(delServidor).length === 0 ? error : null;

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
          <Selector etiqueta={F.tipo} opciones={TIPOS} {...register("tipo")} />
          <div className="flex items-end pb-3">
            <Alerta>{T.precioAplicado[tipo]}</Alerta>
          </div>
          <Campo
            etiqueta={F.nombre}
            error={mensaje("nombre")}
            className="escritorio:col-span-2"
            {...register("nombre")}
          />
          <Selector etiqueta={F.tipoDocumento} opciones={DOCUMENTOS} {...register("tipoDocumento")} />
          <Campo
            etiqueta={F.numeroDocumento}
            inputMode="numeric"
            error={mensaje("numeroDocumento")}
            {...register("numeroDocumento")}
          />
          <Campo
            etiqueta={F.telefono}
            type="tel"
            ayuda={F.telefonoAyuda}
            error={mensaje("telefono")}
            {...register("telefono")}
          />
          <Campo etiqueta={F.correo} type="email" error={mensaje("correo")} {...register("correo")} />
          <Campo
            etiqueta={F.direccion}
            ayuda={F.direccionAyuda}
            error={mensaje("direccion")}
            {...register("direccion")}
          />
          <Campo etiqueta={F.ciudad} error={mensaje("ciudad")} {...register("ciudad")} />
        </div>
      </Tarjeta>
      {errorGeneral && <EstadoError error={errorGeneral} />}
      <Boton type="submit" variante="primario" ocupado={ocupado} className="self-start">
        {F.guardar}
      </Boton>
    </form>
  );
}
