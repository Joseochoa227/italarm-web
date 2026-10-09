/** Textos de garantías y reclamos (BF-17). */
export const TEXTOS_GARANTIAS = {
  titulo: "Garantías",
  subtitulo: "Mano de obra de las instalaciones y equipos con serial vendidos o instalados.",
  estados: { VIGENTE: "Vigente", POR_VENCER: "Por vencer", VENCIDA: "Vencida" } as Record<string, string>,
  clases: { MANO_OBRA: "Mano de obra", EQUIPO: "Equipo" } as Record<string, string>,
  filtros: {
    estado: "Estado",
    todos: "Todos",
    tipo: "Tipo",
    tipos: { todos: "Todos", INSTALACION: "Instalación", VENTA: "Venta" },
    serial: "Buscar por serial",
  },
  lista: "Garantías",
  vacio: "No hay garantías con estos filtros.",
  vence: (fecha: string) => `Vence el ${fecha}`,
  dias: (n: number) =>
    n < 0
      ? n === -1
        ? "venció hace 1 día"
        : `venció hace ${String(-n)} días`
      : n === 0
        ? "vence hoy"
        : n === 1
          ? "queda 1 día"
          : `quedan ${String(n)} días`,
  verGarantias: "Ver garantías",
  reclamos: {
    titulo: "Reclamos",
    vacio: "Sin reclamos.",
    registrar: "Registrar reclamo",
    tituloRegistrar: (sobre: string) => `Reclamo · ${sobre}`,
    fecha: "Fecha",
    problema: "Problema",
    problemaRequerido: "Describe el problema.",
    solucion: "Solución",
    solucionAyuda: "Si todavía no se sabe, se escribe después.",
    escribirSolucion: "Escribir solución",
    tituloSolucion: "Solución del reclamo",
    solucionRequerida: "Escribe la solución.",
    guardar: "Guardar",
    registrado: "Reclamo registrado",
    solucionGuardada: "Solución guardada",
    fueraDeGarantia: "Fuera de garantía",
    pendiente: "Sin solución todavía",
    reemplazo:
      "Si sale un equipo de reemplazo de la bodega, regístralo con un ajuste de salida con motivo Garantía.",
    irAjuste: "Registrar el ajuste",
    registradoPor: (usuario: string, fecha: string) => `Registrado por ${usuario} el ${fecha}`,
  },
} as const;
