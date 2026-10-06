import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { api } from "@/api/cliente";
import { comoErrorApi } from "@/api/problema";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { sinIndefinidos } from "@/lib/objetos";

import { FormularioCliente } from "../components/FormularioCliente";
import { CLAVE_CLIENTES, CLIENTE_VACIO } from "../hooks/clientes";
import type { DatosCliente } from "../schemas/cliente";
import { TEXTOS_CLIENTES } from "../textos";

const F = TEXTOS_CLIENTES.formulario;

export function Component() {
  const avisar = useAvisar();
  const navegar = useNavigate();
  const clienteConsultas = useQueryClient();
  const creacion = useMutation({
    // D-04: el contrato pide version también al crear; el backend la ignora.
    mutationFn: async (datos: DatosCliente) =>
      (await api.POST("/api/v1/clientes", { body: { ...sinIndefinidos(datos), version: 0 } })).data,
    onSuccess: async (cliente) => {
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE_CLIENTES });
      avisar({ titulo: F.creado });
      void navegar(cliente?.id === undefined ? "/clientes" : `/clientes/${String(cliente.id)}`, {
        replace: true,
      });
    },
  });
  return (
    <>
      <EncabezadoPagina
        titulo={F.tituloNuevo}
        volver={{ a: "/clientes", etiqueta: TEXTOS_CLIENTES.titulo }}
      />
      <FormularioCliente
        valores={CLIENTE_VACIO}
        ocupado={creacion.isPending}
        error={creacion.error ? comoErrorApi(creacion.error) : null}
        alGuardar={(datos) => {
          creacion.mutate(datos);
        }}
      />
    </>
  );
}
