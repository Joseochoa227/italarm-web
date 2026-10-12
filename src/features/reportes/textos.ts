/** Textos de Inicio y Reportes (BF-17). */
export const TEXTOS_REPORTES = {
  indicadores: {
    ventas: (cantidad: number) => (cantidad === 1 ? "1 venta" : `${String(cantidad)} ventas`),
    instalaciones: (cantidad: number) =>
      cantidad === 1 ? "1 instalación" : `${String(cantidad)} instalaciones`,
    utilidad: (porcentaje: string) => `${porcentaje} % sobre lo cobrado`,
    productos: (cantidad: number) =>
      cantidad === 1 ? "1 producto en bodega" : `${String(cantidad)} productos en bodega`,
    alDia: (fecha: string) => `Al día de hoy (${fecha})`,
    cobrado: (montos: string) => `Cobrado: ${montos}`,
  },
  stock: {
    titulo: "Stock bajo",
    verInventario: "Ver inventario",
    vacio: "No hay productos por debajo del mínimo.",
    nivel: (stock: string, minimo: string) => `${stock} / mín. ${minimo}`,
    nivelAccesible: (nombre: string, porcentaje: string) => `Nivel de ${nombre}: ${porcentaje} % del mínimo`,
  },
  excel: {
    boton: "Excel",
    descargando: "Generando Excel…",
  },
};
