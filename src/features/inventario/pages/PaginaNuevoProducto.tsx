import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { api } from "@/api/cliente";
import { comoErrorApi } from "@/api/problema";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { sinIndefinidos } from "@/lib/objetos";

import { FormularioProducto } from "../components/FormularioProducto";
import { CLAVE_PRODUCTOS, PRODUCTO_VACIO } from "../hooks/productos";
import type { DatosProducto } from "../schemas/producto";
import { TEXTOS_PRODUCTOS } from "../textos";

const F = TEXTOS_PRODUCTOS.formulario;

/** Nuevo producto (RF-14, RF-16): nace con stock 0 y sin costo. La foto se agrega al editarlo. */
export function Component() {
  const avisar = useAvisar();
  const navegar = useNavigate();
  const clienteConsultas = useQueryClient();
  const creacion = useMutation({
    // D-04: el contrato pide version también al crear; el backend la ignora.
    mutationFn: async (datos: DatosProducto) =>
      (await api.POST("/api/v1/productos", { body: { ...sinIndefinidos(datos), version: 0 } })).data,
    onSuccess: async (producto) => {
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE_PRODUCTOS });
      avisar({ titulo: F.creado, descripcion: F.creadoDetalle });
      void navegar(
        producto?.id === undefined ? "/inventario" : `/inventario/productos/${String(producto.id)}/editar`,
        {
          replace: true,
        },
      );
    },
  });

  return (
    <>
      <EncabezadoPagina titulo={F.tituloNuevo} volver={{ a: "/inventario", etiqueta: F.volver }} />
      <FormularioProducto
        valores={PRODUCTO_VACIO}
        edicion={false}
        ocupado={creacion.isPending}
        error={creacion.error ? comoErrorApi(creacion.error) : null}
        conflicto={false}
        alGuardar={(datos) => {
          creacion.mutate(datos);
        }}
      >
        <Tarjeta>
          <p className="m-0 text-sm text-neutro-700">{F.fotoDespues}</p>
        </Tarjeta>
      </FormularioProducto>
    </>
  );
}
