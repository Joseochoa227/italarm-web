import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { api } from "@/api/cliente";
import { comoErrorApi } from "@/api/problema";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { sinIndefinidos } from "@/lib/objetos";

import { FormularioProveedor } from "../components/FormularioProveedor";
import type { DatosProveedor } from "../schemas/proveedor";
import { TEXTOS_COMPRAS } from "../textos";

const F = TEXTOS_COMPRAS.formulario;
const LISTA = "/compras?pestana=proveedores";
const VACIO = { nombre: "", nit: "", telefono: "", correo: "", ciudad: "", monedaHabitual: "USD" } as const;

export function Component() {
  const avisar = useAvisar();
  const navegar = useNavigate();
  const clienteConsultas = useQueryClient();
  const creacion = useMutation({
    // D-04: el contrato pide version también al crear; el backend la ignora.
    mutationFn: async (datos: DatosProveedor) =>
      (await api.POST("/api/v1/proveedores", { body: { ...sinIndefinidos(datos), version: 0 } })).data,
    onSuccess: async () => {
      await clienteConsultas.invalidateQueries({ queryKey: ["get", "/api/v1/proveedores"] });
      avisar({ titulo: F.creado });
      void navegar(LISTA, { replace: true });
    },
  });
  return (
    <>
      <EncabezadoPagina titulo={F.tituloNuevo} volver={{ a: LISTA, etiqueta: F.volver }} />
      <FormularioProveedor
        valores={VACIO}
        ocupado={creacion.isPending}
        error={creacion.error ? comoErrorApi(creacion.error) : null}
        alGuardar={(datos) => {
          creacion.mutate(datos);
        }}
      />
    </>
  );
}
