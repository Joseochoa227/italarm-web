import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { comoErrorApi } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EstadoError } from "@/components/ui/EstadoError";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { aplicarErroresDeCampo, erroresDeCampo, esConflictoDeVersion, MENSAJES_ERROR } from "@/lib/errores";

import { type Configuracion, useGuardarConfiguracion } from "../hooks/configuracion";
import { esquemaEmpresa } from "../schemas/esquemas";
import { TEXTOS_CONFIGURACION } from "../textos";

const T = TEXTOS_CONFIGURACION;
const CAMPOS = [
  "empresaNombre",
  "empresaLema",
  "empresaNit",
  "empresaCiudad",
  "empresaTelefono",
  "empresaCorreo",
] as const;
type Entrada = z.input<typeof esquemaEmpresa>;

function valoresDe(c: Configuracion): Entrada {
  return {
    empresaNombre: c.empresaNombre ?? "",
    empresaLema: c.empresaLema ?? "",
    empresaNit: c.empresaNit ?? "",
    empresaCiudad: c.empresaCiudad ?? "",
    empresaTelefono: c.empresaTelefono ?? "",
    empresaCorreo: c.empresaCorreo ?? "",
  };
}

/** Datos de la empresa para los PDF y logo (RF-145). */
export function FormularioEmpresa({
  configuracion,
  recargar,
  conflicto,
  setConflicto,
}: {
  configuracion: Configuracion;
  recargar: () => Promise<unknown>;
  /** El aviso de conflicto vive en la página: el formulario se vuelve a montar al recargar. */
  conflicto: boolean;
  setConflicto: (conflicto: boolean) => void;
}) {
  const avisar = useAvisar();
  const guardar = useGuardarConfiguracion();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Entrada, unknown, z.output<typeof esquemaEmpresa>>({
    resolver: zodResolver(esquemaEmpresa),
    defaultValues: valoresDe(configuracion),
  });

  // Conflicto de versión: se recargan los datos actuales y se avisa (guía §5).
  const alFallar = async (e: unknown) => {
    if (esConflictoDeVersion(e)) {
      await recargar();
      setConflicto(true);
      return;
    }
    aplicarErroresDeCampo(comoErrorApi(e), setError, CAMPOS);
  };

  const error = guardar.error && !esConflictoDeVersion(guardar.error) ? comoErrorApi(guardar.error) : null;

  return (
    <div className="flex flex-col gap-4">
      <Tarjeta>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((datos) => {
            setConflicto(false);
            guardar.mutate(
              { actual: configuracion, cambios: datos },
              {
                onSuccess: () => {
                  avisar({ titulo: T.guardado });
                },
                onError: (e) => {
                  void alFallar(e);
                },
              },
            );
          })}
        >
          {conflicto && (
            <Alerta tono="aviso" rol="alert">
              {MENSAJES_ERROR.conflicto}
            </Alerta>
          )}
          <div className="grid gap-4 escritorio:grid-cols-2">
            <Campo
              etiqueta={T.empresa.nombre}
              error={errors.empresaNombre?.message}
              {...register("empresaNombre")}
            />
            <Campo
              etiqueta={T.empresa.lema}
              error={errors.empresaLema?.message}
              {...register("empresaLema")}
            />
            <Campo etiqueta={T.empresa.nit} error={errors.empresaNit?.message} {...register("empresaNit")} />
            <Campo
              etiqueta={T.empresa.ciudad}
              error={errors.empresaCiudad?.message}
              {...register("empresaCiudad")}
            />
            <Campo
              etiqueta={T.empresa.telefono}
              type="tel"
              error={errors.empresaTelefono?.message}
              {...register("empresaTelefono")}
            />
            <Campo
              etiqueta={T.empresa.correo}
              type="email"
              error={errors.empresaCorreo?.message}
              {...register("empresaCorreo")}
            />
          </div>
          {error && erroresDeCampo(error, CAMPOS).length === 0 && <EstadoError error={error} />}
          <Boton type="submit" variante="primario" ocupado={guardar.isPending} className="self-start">
            {T.guardar}
          </Boton>
        </form>
      </Tarjeta>
    </div>
  );
}
