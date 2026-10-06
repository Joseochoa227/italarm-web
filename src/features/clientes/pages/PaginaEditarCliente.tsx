import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { $api, api } from "@/api/cliente";
import { comoErrorApi, errorDeConsultas } from "@/api/problema";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { esConflictoDeVersion } from "@/lib/errores";
import { sinIndefinidos } from "@/lib/objetos";

import { FormularioCliente } from "../components/FormularioCliente";
import { CLAVE_CLIENTES, valoresDeCliente } from "../hooks/clientes";
import type { DatosCliente } from "../schemas/cliente";
import { TEXTOS_CLIENTES } from "../textos";

const F = TEXTOS_CLIENTES.formulario;

/** Editar cliente (RF-75). No hay eliminar (P-11). */
export function Component() {
  const id = Number(useParams().id);
  const avisar = useAvisar();
  const navegar = useNavigate();
  const clienteConsultas = useQueryClient();
  const consulta = $api.useQuery("get", "/api/v1/clientes/{id}", { params: { path: { id } } });
  const [conflicto, setConflicto] = useState(false);
  const guardado = useMutation({
    mutationFn: async (datos: DatosCliente) =>
      (
        await api.PUT("/api/v1/clientes/{id}", {
          params: { path: { id } },
          body: { ...sinIndefinidos(datos), version: consulta.data?.version ?? 0 },
        })
      ).data,
    onMutate: () => {
      setConflicto(false);
    },
    onSuccess: async () => {
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE_CLIENTES, exact: false });
      await clienteConsultas.invalidateQueries({ queryKey: ["get", "/api/v1/clientes/{id}"], exact: false });
      avisar({ titulo: F.guardado });
      void navegar(`/clientes/${String(id)}`);
    },
    onError: async (e) => {
      if (esConflictoDeVersion(e)) {
        await consulta.refetch();
        setConflicto(true);
      }
    },
  });

  const error = errorDeConsultas(consulta);
  if (error) return <EstadoError error={error} alReintentar={() => void consulta.refetch()} />;
  if (!consulta.data) return <CargandoLista filas={4} />;
  return (
    <>
      <EncabezadoPagina
        titulo={F.tituloEditar}
        volver={{ a: `/clientes/${String(id)}`, etiqueta: consulta.data.nombre ?? TEXTOS_CLIENTES.titulo }}
      />
      <FormularioCliente
        key={consulta.data.version}
        valores={valoresDeCliente(consulta.data)}
        ocupado={guardado.isPending}
        error={guardado.error ? comoErrorApi(guardado.error) : null}
        conflicto={conflicto}
        alGuardar={(datos) => {
          guardado.mutate(datos);
        }}
      />
    </>
  );
}
