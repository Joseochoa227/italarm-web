import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { Navigate, useSearchParams } from "react-router";

import { api } from "@/api/cliente";
import { comoErrorApi } from "@/api/problema";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CampoContrasena } from "@/components/ui/CampoContrasena";
import { aplicarErroresDeCampo, erroresDeCampo, mensajeDeError } from "@/lib/errores";

import { useSesion } from "../hooks/contextoSesion";
import { rutaVolver } from "../rutaVolver";
import { type DatosIngreso, esquemaIngreso } from "../schemas/esquemas";
import { TEXTOS_AUTH } from "../textos";

const T = TEXTOS_AUTH.ingreso;
const CAMPOS = ["correo", "contrasena"] as const;

/** Pantalla de ingreso del prototipo, con correo en lugar de usuario (P-01). */
export function Component() {
  const { usuario, iniciar } = useSesion();
  const [parametros] = useSearchParams();
  const destino = rutaVolver(parametros.get("volver"));

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DatosIngreso>({
    resolver: zodResolver(esquemaIngreso),
    defaultValues: { correo: "", contrasena: "" },
  });

  const ingreso = useMutation({
    mutationFn: async (datos: DatosIngreso) => (await api.POST("/api/v1/sesion", { body: datos })).data,
    onSuccess: (respuesta) => {
      if (respuesta) iniciar(respuesta);
    },
    onError: (error) => {
      aplicarErroresDeCampo(comoErrorApi(error), setError, CAMPOS);
    },
  });

  if (usuario) return <Navigate replace to={destino} />;

  const error = ingreso.error ? comoErrorApi(ingreso.error) : null;
  const errorGeneral = error && erroresDeCampo(error, CAMPOS).length === 0 ? mensajeDeError(error) : null;

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="flex w-full max-w-[380px] flex-col gap-6 rounded-lg border border-borde bg-tarjeta p-8 shadow-md">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 marca text-[38px]">ITALARM</h1>
          <p className="m-0 text-[13px] text-neutro-700">{T.subtitulo}</p>
        </div>
        <form
          noValidate
          onSubmit={handleSubmit((datos) => {
            ingreso.mutate(datos);
          })}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-4">
            <Campo
              etiqueta={T.correo}
              type="email"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              error={errors.correo?.message}
              {...register("correo")}
            />
            <CampoContrasena
              etiqueta={T.contrasena}
              autoComplete="current-password"
              error={errors.contrasena?.message}
              {...register("contrasena")}
            />
          </div>
          {errorGeneral && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md bg-peligro-100 px-3 py-2 text-sm text-peligro-900"
            >
              <CircleAlert aria-hidden size={16} className="mt-0.5 shrink-0 text-peligro-700" />
              {errorGeneral}
            </div>
          )}
          <Boton
            type="submit"
            variante="primario"
            bloque
            ocupado={ingreso.isPending}
            className="min-h-[48px] text-base"
          >
            {T.ingresar}
          </Boton>
        </form>
        <p className="m-0 text-center text-xs text-neutro-700">{T.pie}</p>
      </div>
    </main>
  );
}
