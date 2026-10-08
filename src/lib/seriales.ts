/** Seriales: sin espacios a los lados y en mayúsculas, únicos por producto (P-22). */
export function normalizarSerial(serial: string): string {
  return serial.trim().toUpperCase();
}

/** Seriales (ya normalizados) que aparecen más de una vez. */
export function serialesRepetidos(seriales: readonly string[]): Set<string> {
  const vistos = new Set<string>();
  const repetidos = new Set<string>();
  for (const s of seriales.map(normalizarSerial).filter(Boolean)) {
    if (vistos.has(s)) repetidos.add(s);
    vistos.add(s);
  }
  return repetidos;
}

/** Ajusta la lista de seriales a la cantidad de unidades, conservando lo ya escrito. */
export function ajustarSeriales(seriales: readonly string[], cantidad: number): string[] {
  return Array.from({ length: cantidad }, (_, i) => seriales[i] ?? "");
}

/** Cantidad entera de unidades para pedir seriales; 0 si la cantidad no es un entero positivo. */
export function unidadesDe(cantidad: string | null | undefined): number {
  if (!cantidad || !/^\d+$/.test(cantidad)) return 0;
  return Math.min(Number(cantidad), 1000);
}
