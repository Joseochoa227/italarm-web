/** Textos de compras y proveedores (BF-17). */
export const TEXTOS_COMPRAS = {
  titulo: "Compras",
  pestanas: { compras: "Compras", proveedores: "Proveedores" },
  proveedores: {
    nuevo: "Nuevo proveedor",
    buscar: "Buscar por nombre, NIT o ciudad",
    vacio: "No hay proveedores con esta búsqueda.",
    vacioSinFiltros: "Todavía no hay proveedores. Crea el primero.",
    moneda: "Moneda habitual",
    nit: "NIT",
  },
  formulario: {
    tituloNuevo: "Nuevo proveedor",
    tituloEditar: "Editar proveedor",
    volver: "Proveedores",
    nombre: "Nombre o razón social",
    nit: "NIT o documento",
    telefono: "Teléfono",
    correo: "Correo",
    ciudad: "Ciudad",
    moneda: "Moneda habitual",
    monedaAyuda: "Se propone al registrar una compra de este proveedor (RF-40).",
    guardar: "Guardar",
    creado: "Proveedor creado",
    guardado: "Proveedor guardado",
  },
  validacion: {
    nombre: "Escribe el nombre o la razón social.",
    nit: "Solo números, puntos y guion.",
    correo: "Escribe un correo válido.",
    largo: (n: number) => `Máximo ${String(n)} caracteres.`,
  },
} as const;
