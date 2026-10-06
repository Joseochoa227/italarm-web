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
import { Confirmacion } from "@/components/ui/Confirmacion";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { Dialogo } from "@/components/ui/Dialogo";
import { EstadoError } from "@/components/ui/EstadoError";
import { aplicarErroresDeCampo, erroresDeCampo, MENSAJES_ERROR, esConflictoDeVersion } from "@/lib/errores";

import { esquemaCategoria } from "../schemas/esquemas";
import { TEXTOS_CONFIGURACION } from "../textos";

type Categoria = components["schemas"]["CategoriaVista"];
const T = TEXTOS_CONFIGURACION.categorias;
const CLAVE = ["get", "/api/v1/categorias"];

function DialogoCategoria({ categoria, alCerrar }: { categoria: Categoria | null; alCerrar: () => void }) {
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.input<typeof esquemaCategoria>, unknown, z.output<typeof esquemaCategoria>>({
    resolver: zodResolver(esquemaCategoria),
    defaultValues: { nombre: categoria?.nombre ?? "" },
  });
  const guardado = useMutation({
    mutationFn: async ({ nombre }: { nombre: string }) => {
      if (categoria?.id === undefined) {
        // D-04: el contrato pide version también al crear; el backend la ignora.
        return (await api.POST("/api/v1/categorias", { body: { nombre, version: 0 } })).data;
      }
      return (
        await api.PUT("/api/v1/categorias/{id}", {
          params: { path: { id: categoria.id } },
          body: { nombre, version: categoria.version ?? 0 },
        })
      ).data;
    },
    onSuccess: async () => {
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE });
      avisar({ titulo: categoria ? T.actualizada : T.creada });
      alCerrar();
    },
    onError: async (e) => {
      if (esConflictoDeVersion(e)) await clienteConsultas.invalidateQueries({ queryKey: CLAVE });
      aplicarErroresDeCampo(comoErrorApi(e), setError, ["nombre"], { CATEGORIA_DUPLICADA: "nombre" });
    },
  });
  const error = guardado.error ? comoErrorApi(guardado.error) : null;
  return (
    <Dialogo
      abierto
      alCambiar={(a) => {
        if (!a) alCerrar();
      }}
      titulo={categoria ? T.tituloEditar : T.tituloNueva}
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((d) => {
          guardado.mutate(d);
        })}
      >
        <Campo etiqueta={T.nombre} error={errors.nombre?.message} {...register("nombre")} />
        {error && esConflictoDeVersion(error) && <p className="text-sm">{MENSAJES_ERROR.conflicto}</p>}
        {error &&
          !esConflictoDeVersion(error) &&
          erroresDeCampo(error, ["nombre"], { CATEGORIA_DUPLICADA: "nombre" }).length === 0 && (
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

/** Categorías de productos (RF-15, RF-148): crear, renombrar y eliminar si no tienen productos. */
export function GestionCategorias() {
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const consulta = $api.useQuery("get", "/api/v1/categorias");
  const [editando, setEditando] = useState<Categoria | "nueva" | null>(null);
  const [eliminando, setEliminando] = useState<Categoria | null>(null);
  const eliminacion = useMutation({
    mutationFn: async (id: number) => {
      await api.DELETE("/api/v1/categorias/{id}", { params: { path: { id } } });
    },
    onSuccess: async () => {
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE });
      avisar({ titulo: T.eliminada });
      setEliminando(null);
    },
  });

  const error = errorDeConsultas(consulta);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="m-0 flex-1 text-sm text-neutro-700">{T.soloSinProductos}</p>
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
        <CargandoLista filas={4} />
      ) : (consulta.data ?? []).length === 0 ? (
        <p className="text-sm text-neutro-700">{T.vacio}</p>
      ) : (
        <ul
          aria-label={TEXTOS_CONFIGURACION.pestanas.categorias}
          className="m-0 list-none border-t border-divisor p-0"
        >
          {(consulta.data ?? []).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 border-b border-divisor py-2">
              <span className="min-w-[160px] flex-1 font-medium">{c.nombre}</span>
              <span className="text-sm text-neutro-700">{T.productos(c.cantidadProductos ?? 0)}</span>
              <Boton
                variante="fantasma"
                icono
                aria-label={`${T.renombrar} ${c.nombre ?? ""}`}
                onClick={() => {
                  setEditando(c);
                }}
              >
                <Pencil aria-hidden size={16} />
              </Boton>
              <Boton
                variante="fantasma"
                icono
                aria-label={`${T.eliminar} ${c.nombre ?? ""}`}
                onClick={() => {
                  eliminacion.reset();
                  setEliminando(c);
                }}
              >
                <Trash2 aria-hidden size={16} />
              </Boton>
            </li>
          ))}
        </ul>
      )}
      {editando && (
        <DialogoCategoria
          categoria={editando === "nueva" ? null : editando}
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
          {eliminacion.error ? <EstadoError error={eliminacion.error} /> : T.soloSinProductos}
        </Confirmacion>
      )}
    </div>
  );
}
