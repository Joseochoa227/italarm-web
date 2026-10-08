/** Textos comunes a ventas, instalaciones y cotizaciones (BF-17). */
export const TEXTOS_COMERCIAL = {
  cliente: {
    etiqueta: "Cliente",
    elegir: "Elegir cliente",
    cambiar: "Cambiar",
    titulo: "Elegir cliente",
    buscar: "Buscar por nombre, documento o teléfono",
    resultados: "Clientes",
    vacio: "No hay clientes con esa búsqueda.",
    nuevo: "Nuevo cliente",
    tituloNuevo: "Nuevo cliente",
    creado: "Cliente creado",
    quitarFiltro: (nombre: string) => `Cliente: ${nombre}. Quitar filtro`,
  },
  seriales: {
    titulo: "Seriales que salen",
    elegidos: (n: number) => (n === 1 ? "1 elegido" : `${String(n)} elegidos`),
    vacio: "No hay seriales en bodega.",
    noEnBodega: (serial: string) => `${serial} no está en bodega para este producto.`,
    elegido: (serial: string) => `${serial} elegido`,
    serial: (numero: string) => `Serial ${numero}`,
  },
  comprobante: {
    descargar: "Descargar PDF",
    whatsapp: "Enviar por WhatsApp",
    whatsappLargo: "Enviar comprobante por WhatsApp",
    compartirTitulo: (consecutivo: string) => `Comprobante ${consecutivo}`,
  },
} as const;
