import type { Query } from "@tanstack/react-query";

import type { components } from "@/api/esquema";
import { decimalAEdicion } from "@/lib/decimal";

import type { EntradaProducto } from "../schemas/producto";

export type Producto = components["schemas"]["ProductoVista"];

/**
 * Consultas que cambian al crear, editar o eliminar un producto: el catálogo y el inventario
 * (GET /inventario y el detalle del producto).
 */
export const CONSULTAS_PRODUCTOS = {
  predicate: (consulta: Query) => {
    const ruta = consulta.queryKey[1];
    return typeof ruta === "string" && /^\/api\/v1\/(productos|inventario)/.test(ruta);
  },
};

export const PRODUCTO_VACIO: EntradaProducto = {
  codigo: "",
  nombre: "",
  marca: "",
  modelo: "",
  categoriaId: "",
  unidadMedidaId: "",
  controlaSerial: false,
  monedaPrecio: "USD",
  precioInstalador: "",
  precioClienteFinal: "",
  stockMinimo: "",
  descripcion: "",
};

/** Producto de la API → valores del formulario (los decimales, con coma, W-04). */
export function valoresDeProducto(p: Producto): EntradaProducto {
  return {
    codigo: p.codigo ?? "",
    nombre: p.nombre ?? "",
    marca: p.marca ?? "",
    modelo: p.modelo ?? "",
    categoriaId: p.categoria?.id === undefined ? "" : String(p.categoria.id),
    unidadMedidaId: p.unidadMedida?.id === undefined ? "" : String(p.unidadMedida.id),
    controlaSerial: p.controlaSerial ?? false,
    monedaPrecio: p.precioInstalador?.moneda ?? "USD",
    precioInstalador: decimalAEdicion(p.precioInstalador?.monto),
    precioClienteFinal: decimalAEdicion(p.precioClienteFinal?.monto),
    stockMinimo: decimalAEdicion(p.stockMinimo),
    descripcion: p.descripcion ?? "",
  };
}
