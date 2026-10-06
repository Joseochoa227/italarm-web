import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { $api, api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { comoErrorApi, errorDeConsultas } from "@/api/problema";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { Casilla } from "@/components/ui/Casilla";
import { Confirmacion } from "@/components/ui/Confirmacion";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { Dialogo } from "@/components/ui/Dialogo";
import { EstadoError } from "@/components/ui/EstadoError";
import { aplicarErroresDeCampo, erroresDeCampo, esConflictoDeVersion, MENSAJES_ERROR } from "@/lib/errores";

import { esquemaUnidad } from "../schemas/esquemas";
import { TEXTOS_CONFIGURACION } from "../textos";

type Unidad = components["schemas"]["UnidadMedidaVista"];
const T = TEXTOS_CONFIGURACION.unidades;
const CLAVE = ["get", "/api/v1/unidades-medida"];
const CAMPOS = ["nombre", "abreviatura", "admiteDecimales"] as const;
const POR_CODIGO = { UNIDAD_DUPLICADA: "nombre" } as const;

function DialogoUnidad({ unidad, alCerrar }: { unidad: Unidad | null; alCerrar: () => void }) {
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.input<typeof esquemaUnidad>, unknown, z.output<typeof esquemaUnidad>>({
    resolver: zodResolver(esquemaUnidad),
    defaultValues: {
      nombre: unidad?.nombre ?? "",
      abreviatura: unidad?.abreviatura ?? "",
      admiteDecimales: unidad?.admiteDecimales ?? false,
    },
  });
  const guardado = useMutation({
    mutationFn: async (datos: z.output<typeof esquemaUnidad>) => {
      if (unidad?.id === undefined) {
        // D-04: el contrato pide version también al crear; el backend la ignora.
        return (await api.POST("/api/v1/unidades-medida", { body: { ...datos, version: 0 } })).data;
      }
      return (
        await api.PUT("/api/v1/unidades-medida/{id}", {
          params: { path: { id: unidad.id } },
          body: { ...datos, version: unidad.version ?? 0 },
        })
      ).data;
    },
    onSuccess: async () => {
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE });
      avisar({ titulo: unidad ? T.actualizada : T.creada });
      alCerrar();
    },
    onError: async (e) => {
      if (esConflictoDeVersion(e)) await clienteConsultas.invalidateQueries({ queryKey: CLAVE });
      aplicarErroresDeCampo(comoErrorApi(e), setError, CAMPOS, POR_CODIGO);
    },
  });
  const error = guardado.error ? comoErrorApi(guardado.error) : null;
  return (
    <Dialogo
      abierto
      alCambiar={(a) => {
        if (!a) alCerrar();
      }}
      titulo={unidad ? T.tituloEditar : T.tituloNueva}
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((d) => {
          guardado.mutate(d);
        })}
      >
        <Campo etiqueta={T.nombre} error={errors.nombre?.message} {...register("nombre")} />
        <Campo etiqueta={T.abreviatura} error={errors.abreviatura?.message} {...register("abreviatura")} />
        <Casilla etiqueta={T.admiteDecimales} {...register("admiteDecimales")} />
        {error && esConflictoDeVersion(error) && <p className="m-0 text-sm">{MENSAJES_ERROR.conflicto}</p>}
        {error && !esConflictoDeVersion(error) && erroresDeCampo(error, CAMPOS, POR_CODIGO).length === 0 && (
          <EstadoError error={error} />
        )}
        <div className="flex justify-end gap-2">
          <Boton onClick={alCerrar}>{TEXTOS_CONFIGURACION.cancelar}</Boton>
          <Boton type="submit" variante="primario" ocupado={guardado.isPending}>
            {TEXTOS_CONFIGURACION.guardarDialogo}
          </Boton>
        </div>
      </form>
    </Dialogo>
  );
}

/** Unidades de medida (RF-148, P-09): crear, editar y eliminar si ningún producto las usa. */
export function GestionUnidades() {
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const consulta = $api.useQuery("get", "/api/v1/unidades-medida");
  const [editando, setEditando] = useState<Unidad | "nueva" | null>(null);
  const [eliminando, setEliminando] = useState<Unidad | null>(null);
  const eliminacion = useMutation({
    mutationFn: async (id: number) => {
      await api.DELETE("/api/v1/unidades-medida/{id}", { params: { path: { id } } });
    },
    onSuccess: async () => {
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE });
      avisar({ titulo: T.eliminada });
      setEliminando(null);
    },
  });
  const error = errorDeConsultas(consulta);
  const unidades = consulta.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="m-0 flex-1 text-sm text-neutro-700">{T.soloSinUso}</p>
        <Boton
          variante="primario"
          onClick={() => {
            setEditando("nueva");
          }}
        >
          <Plus aria-hidden size={16} />
          {T.nueva}
        </Boton>
      </div>
      {error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista filas={3} />
      ) : unidades.length === 0 ? (
        <p className="text-sm text-neutro-700">{T.vacio}</p>
      ) : (
        <ul
          aria-label={TEXTOS_CONFIGURACION.pestanas.unidades}
          className="m-0 list-none border-t border-divisor p-0"
        >
          {unidades.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 border-b border-divisor py-2">
              <span className="min-w-[160px] flex-1 font-medium">{u.nombre}</span>
              <span className="text-sm text-neutro-700">
                {u.abreviatura} · {u.admiteDecimales ? T.conDecimales : T.soloEnteras}
              </span>
              <Boton
                variante="fantasma"
                icono
                aria-label={`${T.editar} ${u.nombre ?? ""}`}
                onClick={() => {
                  setEditando(u);
                }}
              >
                <Pencil aria-hidden size={16} />
              </Boton>
              <Boton
                variante="fantasma"
                icono
                aria-label={`${T.eliminar} ${u.nombre ?? ""}`}
                onClick={() => {
                  eliminacion.reset();
                  setEliminando(u);
                }}
              >
                <Trash2 aria-hidden size={16} />
              </Boton>
            </li>
          ))}
        </ul>
      )}
      {editando && (
        <DialogoUnidad
          unidad={editando === "nueva" ? null : editando}
          alCerrar={() => {
            setEditando(null);
          }}
        />
      )}
      {eliminando && (
        <Confirmacion
          abierto
          alCambiar={(a) => {
            if (!a) setEliminando(null);
          }}
          titulo={T.confirmarEliminar(eliminando.nombre ?? "")}
          confirmar={T.eliminar}
          peligro
          ocupado={eliminacion.isPending}
          alConfirmar={() => {
            if (eliminando.id !== undefined) eliminacion.mutate(eliminando.id);
          }}
        >
          {eliminacion.error ? <EstadoError error={eliminacion.error} /> : T.soloSinUso}
        </Confirmacion>
      )}
    </div>
  );
}
