import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { api } from "@/api/cliente";
import { comoFormulario } from "@/api/archivos";
import { comoErrorApi } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EstadoError } from "@/components/ui/EstadoError";
import { SelectorImagen } from "@/components/ui/SelectorImagen";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { aplicarErroresDeCampo, erroresDeCampo, esConflictoDeVersion, MENSAJES_ERROR } from "@/lib/errores";

import { type Configuracion, CONSULTA_CONFIGURACION, useGuardarConfiguracion } from "../hooks/configuracion";
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
}: {
  configuracion: Configuracion;
  recargar: () => Promise<unknown>;
}) {
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const guardar = useGuardarConfiguracion();
  const [conflicto, setConflicto] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Entrada, unknown, z.output<typeof esquemaEmpresa>>({
    resolver: zodResolver(esquemaEmpresa),
    // Al recargar (guardado o conflicto de versión) el formulario muestra los datos actuales.
    values: valoresDe(configuracion),
  });

  const actualizarLogo = (nueva: Configuracion | undefined) => {
    if (nueva) clienteConsultas.setQueryData(CONSULTA_CONFIGURACION.queryKey, nueva);
  };

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
      <Tarjeta>
        <SelectorImagen
          etiqueta={T.empresa.logo}
          uso="logo"
          url={configuracion.logoUrl}
          alSubir={async (archivo) => {
            const r = await api.PUT("/api/v1/configuracion/logo", {
              body: { archivo },
              bodySerializer: comoFormulario,
            });
            actualizarLogo(r.data);
          }}
          alQuitar={async () => {
            actualizarLogo((await api.DELETE("/api/v1/configuracion/logo")).data);
          }}
        />
      </Tarjeta>
    </div>
  );
}
