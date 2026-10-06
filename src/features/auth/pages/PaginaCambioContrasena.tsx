import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

import { api } from "@/api/cliente";
import { comoErrorApi } from "@/api/problema";
import { Boton } from "@/components/ui/Boton";
import { CampoContrasena } from "@/components/ui/CampoContrasena";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EstadoError } from "@/components/ui/EstadoError";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { aplicarErroresDeCampo, erroresDeCampo } from "@/lib/errores";

import { type DatosCambioContrasena, esquemaCambioContrasena } from "../schemas/esquemas";
import { TEXTOS_AUTH } from "../textos";

const T = TEXTOS_AUTH.contrasena;
const CAMPOS = ["contrasenaActual", "contrasenaNueva", "confirmacion"] as const;
const CODIGOS_POR_CAMPO = {
  CONTRASENA_ACTUAL_INCORRECTA: "contrasenaActual",
  CONTRASENA_DEBIL: "contrasenaNueva",
  CONTRASENA_NO_COINCIDE: "confirmacion",
} as const;

/** Cambio de la propia contraseña (RU-07). El backend conserva esta sesión y cierra las demás. */
export function Component() {
  const avisar = useAvisar();
  const navegar = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DatosCambioContrasena>({
    resolver: zodResolver(esquemaCambioContrasena),
    defaultValues: { contrasenaActual: "", contrasenaNueva: "", confirmacion: "" },
  });

  const cambio = useMutation({
    mutationFn: async (datos: DatosCambioContrasena) => {
      await api.PUT("/api/v1/usuarios/actual/contrasena", { body: datos });
    },
    onSuccess: () => {
      avisar({ titulo: T.exito, descripcion: T.exitoDetalle });
      void navegar("/");
    },
    onError: (e) => {
      aplicarErroresDeCampo(comoErrorApi(e), setError, CAMPOS, CODIGOS_POR_CAMPO);
    },
  });

  const error = cambio.error ? comoErrorApi(cambio.error) : null;
  const errorGeneral = error !== null && erroresDeCampo(error, CAMPOS, CODIGOS_POR_CAMPO).length === 0;

  return (
    <div className="flex max-w-[520px] flex-col gap-6">
      <div>
        <h1 className="m-0 text-[32px]">{T.titulo}</h1>
        <p className="m-0 text-sm text-neutro-700">{T.descripcion}</p>
      </div>
      <Tarjeta>
        <form
          noValidate
          onSubmit={handleSubmit((datos) => {
            cambio.mutate(datos);
          })}
          className="flex flex-col gap-4"
        >
          <CampoContrasena
            etiqueta={T.actual}
            autoComplete="current-password"
            error={errors.contrasenaActual?.message}
            {...register("contrasenaActual")}
          />
          <CampoContrasena
            etiqueta={T.nueva}
            autoComplete="new-password"
            ayuda={T.reglas}
            error={errors.contrasenaNueva?.message}
            {...register("contrasenaNueva")}
          />
          <CampoContrasena
            etiqueta={T.confirmacion}
            autoComplete="new-password"
            error={errors.confirmacion?.message}
            {...register("confirmacion")}
          />
          {errorGeneral && <EstadoError error={error} />}
          <Boton type="submit" variante="primario" ocupado={cambio.isPending} className="self-start">
            {T.guardar}
          </Boton>
        </form>
      </Tarjeta>
    </div>
  );
}
