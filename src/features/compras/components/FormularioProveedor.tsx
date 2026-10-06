import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { ErrorApi } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { EstadoError } from "@/components/ui/EstadoError";
import { Selector } from "@/components/ui/Selector";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { MONEDAS } from "@/features/inventario/textos";
import { erroresDeCampo, MENSAJES_ERROR } from "@/lib/errores";

import { type DatosProveedor, type EntradaProveedor, esquemaProveedor } from "../schemas/proveedor";
import { TEXTOS_COMPRAS } from "../textos";

const F = TEXTOS_COMPRAS.formulario;
const CAMPOS = ["nombre", "nit", "telefono", "correo", "ciudad", "monedaHabitual"] as const;

/** Formulario de proveedor (RF-37). No hay eliminar (P-11). */
export function FormularioProveedor({
  valores,
  ocupado,
  error,
  conflicto = false,
  alGuardar,
}: {
  valores: EntradaProveedor;
  ocupado: boolean;
  error: ErrorApi | null;
  conflicto?: boolean;
  alGuardar: (datos: DatosProveedor) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EntradaProveedor, unknown, DatosProveedor>({
    resolver: zodResolver(esquemaProveedor),
    values: valores,
  });
  const delServidor = error
    ? Object.fromEntries(erroresDeCampo(error, CAMPOS).map((e) => [e.campo, e.mensaje]))
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
          <Campo
            etiqueta={F.nombre}
            error={mensaje("nombre")}
            className="escritorio:col-span-2"
            {...register("nombre")}
          />
          <Campo etiqueta={F.nit} error={mensaje("nit")} {...register("nit")} />
          <Selector
            etiqueta={F.moneda}
            ayuda={F.monedaAyuda}
            opciones={MONEDAS}
            {...register("monedaHabitual")}
          />
          <Campo etiqueta={F.telefono} type="tel" error={mensaje("telefono")} {...register("telefono")} />
          <Campo etiqueta={F.correo} type="email" error={mensaje("correo")} {...register("correo")} />
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
