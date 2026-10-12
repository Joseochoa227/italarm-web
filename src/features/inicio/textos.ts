/** Textos de la pantalla de Inicio (BF-17). */
export const TEXTOS_INICIO = {
  hola: (nombre: string) => `Hola, ${nombre}`,
  registrarTasa: "Registrar tasa",
  indicadores: "Indicadores del mes",
  ventas: "Ventas del mes",
  instalaciones: "Instalaciones del mes",
  utilidad: "Utilidad del mes",
  inventario: "Inventario valorizado",
  accesos: "Accesos rápidos",
  garantias: {
    titulo: "Garantías por vencer",
    total: (n: number) =>
      n === 1 ? "1 vence en los próximos 30 días" : `${String(n)} vencen en los próximos 30 días`,
    vacio: "Ninguna garantía vence en los próximos 30 días.",
    verTodas: "Ver todas",
    vence: (fecha: string) => `vence ${fecha}`,
    dias: (n: number) => (n <= 0 ? "Hoy" : n === 1 ? "1 día" : `${String(n)} días`),
  },
  cotizaciones: {
    titulo: "Cotizaciones en evaluación",
    total: (n: number) => (n === 1 ? "1 pendiente de respuesta" : `${String(n)} pendientes de respuesta`),
    vacio: "No hay cotizaciones esperando respuesta.",
    verTodas: "Ver todas",
    porVencer: "Por vencer",
  },
  movimientos: {
    titulo: "Últimos movimientos",
    vacio: "Todavía no hay movimientos.",
    anulado: "Anulado",
    tipos: {
      VENTA: "Venta",
      INSTALACION: "Instalación",
      COMPRA: "Compra",
      AJUSTE: "Ajuste",
      INVENTARIO_INICIAL: "Inventario inicial",
    } as Record<string, string>,
  },
  verTodos: "Ver todos",
};
