import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { comoErrorApi } from "@/api/problema";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CampoContrasena } from "@/components/ui/CampoContrasena";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { Dialogo } from "@/components/ui/Dialogo";
import { EstadoError } from "@/components/ui/EstadoError";
import { aplicarErroresDeCampo, erroresDeCampo } from "@/lib/errores";

import { esquemaNuevoUsuario, esquemaRestablecer } from "../schemas/esquemas";
import { TEXTOS_USUARIOS } from "../textos";

const CLAVE_USUARIOS = ["get", "/api/v1/usuarios"];

type Usuario = components["schemas"]["UsuarioVista"];
const F = TEXTOS_USUARIOS.formulario;

const CAMPOS_NUEVO = ["nombre", "correo", "contrasena", "confirmacion"] as const;
const CODIGOS_NUEVO = {
  USUARIO_CORREO_DUPLICADO: "correo",
  CONTRASENA_DEBIL: "contrasena",
  CONTRASENA_NO_COINCIDE: "confirmacion",
} as const;

/** Nuevo usuario (RU-04, P-15). */
export function DialogoNuevoUsuario({ alCerrar }: { alCerrar: () => void }) {
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.input<typeof esquemaNuevoUsuario>, unknown, z.output<typeof esquemaNuevoUsuario>>({
    resolver: zodResolver(esquemaNuevoUsuario),
    defaultValues: { nombre: "", correo: "", contrasena: "", confirmacion: "" },
  });
  const creacion = useMutation({
    mutationFn: async (datos: z.output<typeof esquemaNuevoUsuario>) =>
      (await api.POST("/api/v1/usuarios", { body: datos })).data,
    onSuccess: async () => {
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE_USUARIOS });
      avisar({ titulo: TEXTOS_USUARIOS.creado });
      alCerrar();
    },
    onError: (e) => {
      aplicarErroresDeCampo(comoErrorApi(e), setError, CAMPOS_NUEVO, CODIGOS_NUEVO);
    },
  });
  const error = creacion.error ? comoErrorApi(creacion.error) : null;
  return (
    <Dialogo
      abierto
      alCambiar={(a) => {
        if (!a) alCerrar();
      }}
      titulo={TEXTOS_USUARIOS.nuevo}
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((d) => {
          creacion.mutate(d);
        })}
      >
        <Campo etiqueta={F.nombre} error={errors.nombre?.message} {...register("nombre")} />
        <Campo
          etiqueta={F.correo}
          type="email"
          autoComplete="off"
          error={errors.correo?.message}
          {...register("correo")}
        />
        <CampoContrasena
          etiqueta={F.contrasena}
          autoComplete="new-password"
          ayuda={F.reglas}
          error={errors.contrasena?.message}
          {...register("contrasena")}
        />
        <CampoContrasena
          etiqueta={F.confirmacion}
          autoComplete="new-password"
          error={errors.confirmacion?.message}
          {...register("confirmacion")}
        />
        {error && erroresDeCampo(error, CAMPOS_NUEVO, CODIGOS_NUEVO).length === 0 && (
          <EstadoError error={error} />
        )}
        <div className="flex justify-end gap-2">
          <Boton onClick={alCerrar}>{F.cancelar}</Boton>
          <Boton type="submit" variante="primario" ocupado={creacion.isPending}>
            {F.guardar}
          </Boton>
        </div>
      </form>
    </Dialogo>
  );
}

const CAMPOS_RESTABLECER = ["contrasenaNueva", "confirmacion"] as const;
const CODIGOS_RESTABLECER = {
  CONTRASENA_DEBIL: "contrasenaNueva",
  CONTRASENA_NO_COINCIDE: "confirmacion",
} as const;

/** Restablecer la contraseña de otro usuario: se cierran sus sesiones. */
export function DialogoRestablecer({ usuario, alCerrar }: { usuario: Usuario; alCerrar: () => void }) {
  const avisar = useAvisar();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.input<typeof esquemaRestablecer>, unknown, z.output<typeof esquemaRestablecer>>({
    resolver: zodResolver(esquemaRestablecer),
    defaultValues: { contrasenaNueva: "", confirmacion: "" },
  });
  const restablecer = useMutation({
    mutationFn: async (datos: z.output<typeof esquemaRestablecer>) =>
      (
        await api.POST("/api/v1/usuarios/{id}/restablecer-contrasena", {
          params: { path: { id: usuario.id ?? 0 } },
          body: datos,
        })
      ).data,
    onSuccess: () => {
      avisar({ titulo: TEXTOS_USUARIOS.restablecida, descripcion: TEXTOS_USUARIOS.restablecidaDetalle });
      alCerrar();
    },
    onError: (e) => {
      aplicarErroresDeCampo(comoErrorApi(e), setError, CAMPOS_RESTABLECER, CODIGOS_RESTABLECER);
    },
  });
  const error = restablecer.error ? comoErrorApi(restablecer.error) : null;
  return (
    <Dialogo
      abierto
      alCambiar={(a) => {
        if (!a) alCerrar();
      }}
      titulo={F.tituloRestablecer(usuario.nombre ?? "")}
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((d) => {
          restablecer.mutate(d);
        })}
      >
        <CampoContrasena
          etiqueta={F.contrasenaNueva}
          autoComplete="new-password"
          ayuda={F.reglas}
          error={errors.contrasenaNueva?.message}
          {...register("contrasenaNueva")}
        />
        <CampoContrasena
          etiqueta={F.confirmacion}
          autoComplete="new-password"
          error={errors.confirmacion?.message}
          {...register("confirmacion")}
        />
        {error && erroresDeCampo(error, CAMPOS_RESTABLECER, CODIGOS_RESTABLECER).length === 0 && (
          <EstadoError error={error} />
        )}
        <div className="flex justify-end gap-2">
          <Boton onClick={alCerrar}>{F.cancelar}</Boton>
          <Boton type="submit" variante="primario" ocupado={restablecer.isPending}>
            {F.guardar}
          </Boton>
        </div>
      </form>
    </Dialogo>
  );
}
