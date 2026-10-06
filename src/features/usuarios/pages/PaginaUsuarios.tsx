import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus } from "lucide-react";
import { useState } from "react";

import { $api, api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { errorDeConsultas } from "@/api/problema";
import { Boton } from "@/components/ui/Boton";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { Confirmacion } from "@/components/ui/Confirmacion";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { useSesion } from "@/features/auth/hooks/contextoSesion";
import { mensajeDeError } from "@/lib/errores";
import { inicial } from "@/lib/texto";

import { DialogoNuevoUsuario, DialogoRestablecer } from "../components/DialogosUsuario";
import { TEXTOS_USUARIOS } from "../textos";

type Usuario = components["schemas"]["UsuarioVista"];
const T = TEXTOS_USUARIOS;
const CLAVE_USUARIOS = ["get", "/api/v1/usuarios"];

/** Gestión de usuarios (RF-148, RU-04, P-15). */
export function Component() {
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const { usuario: yo } = useSesion();
  const consulta = $api.useQuery("get", "/api/v1/usuarios");
  const [nuevo, setNuevo] = useState(false);
  const [restableciendo, setRestableciendo] = useState<Usuario | null>(null);
  const [desactivando, setDesactivando] = useState<Usuario | null>(null);

  const cambioEstado = useMutation({
    mutationFn: async ({ id, activar }: { id: number; activar: boolean }) =>
      (
        await (activar
          ? api.POST("/api/v1/usuarios/{id}/activar", { params: { path: { id } } })
          : api.POST("/api/v1/usuarios/{id}/desactivar", { params: { path: { id } } }))
      ).data,
    onSuccess: async (_, { activar }) => {
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE_USUARIOS });
      avisar({ titulo: activar ? T.activado : T.desactivado });
      setDesactivando(null);
    },
    onError: (e, { activar }) => {
      if (activar) avisar({ titulo: mensajeDeError(e), tono: "error" });
    },
  });

  const error = errorDeConsultas(consulta);
  const usuarios = consulta.data ?? [];

  return (
    <>
      <EncabezadoPagina
        titulo={T.titulo}
        subtitulo={T.subtitulo}
        acciones={
          <Boton
            variante="primario"
            onClick={() => {
              setNuevo(true);
            }}
          >
            <Plus aria-hidden size={16} />
            {T.nuevo}
          </Boton>
        }
      />
      {error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista filas={2} />
      ) : usuarios.length === 0 ? (
        <p className="text-sm text-neutro-700">{T.vacio}</p>
      ) : (
        <ul aria-label={T.titulo} className="m-0 list-none border-t border-divisor p-0">
          {usuarios.map((u) => {
            const esYo = u.id === yo?.id;
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-3 border-b border-divisor py-3">
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full border border-divisor font-titulo font-semibold"
                >
                  {inicial(u.nombre)}
                </span>
                <div className="min-w-[180px] flex-1">
                  <div className="font-medium">
                    {u.nombre} {esYo && <Etiqueta tono="contorno">{T.tu}</Etiqueta>}
                  </div>
                  <div className="text-sm text-neutro-700">{u.correo}</div>
                </div>
                <Etiqueta tono={u.activo ? "acento" : "neutro"}>{u.activo ? T.activo : T.inactivo}</Etiqueta>
                {/* Para uno mismo no hay desactivar (NO_PUEDE_DESACTIVARSE_A_SI_MISMO) ni restablecer
                    (USAR_CAMBIO_DE_CONTRASENA): se usa Cambiar contraseña. */}
                {!esYo && (
                  <div className="flex flex-wrap gap-1">
                    <Boton
                      variante="fantasma"
                      onClick={() => {
                        setRestableciendo(u);
                      }}
                    >
                      <KeyRound aria-hidden size={16} />
                      {T.restablecer}
                    </Boton>
                    {u.activo ? (
                      <Boton
                        variante="fantasma"
                        onClick={() => {
                          cambioEstado.reset();
                          setDesactivando(u);
                        }}
                      >
                        {T.desactivar}
                      </Boton>
                    ) : (
                      <Boton
                        variante="fantasma"
                        ocupado={cambioEstado.isPending && cambioEstado.variables.id === u.id}
                        onClick={() => {
                          if (u.id !== undefined) cambioEstado.mutate({ id: u.id, activar: true });
                        }}
                      >
                        {T.activar}
                      </Boton>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {nuevo && (
        <DialogoNuevoUsuario
          alCerrar={() => {
            setNuevo(false);
          }}
        />
      )}
      {restableciendo && (
        <DialogoRestablecer
          usuario={restableciendo}
          alCerrar={() => {
            setRestableciendo(null);
          }}
        />
      )}
      {desactivando && (
        <Confirmacion
          abierto
          alCambiar={(a) => {
            if (!a) setDesactivando(null);
          }}
          titulo={T.confirmarDesactivar(desactivando.nombre ?? "")}
          confirmar={T.desactivar}
          peligro
          ocupado={cambioEstado.isPending}
          alConfirmar={() => {
            if (desactivando.id !== undefined) cambioEstado.mutate({ id: desactivando.id, activar: false });
          }}
        >
          {cambioEstado.error ? <EstadoError error={cambioEstado.error} /> : T.explicacionDesactivar}
        </Confirmacion>
      )}
    </>
  );
}
