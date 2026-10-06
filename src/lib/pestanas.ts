/** Pestaña activa leída de la URL (?pestana=…), o la primera si falta o no es válida. */
export function pestanaActiva<T extends string>(
  valor: string | null,
  opciones: readonly [{ valor: T }, ...{ valor: T }[]],
): T {
  return (opciones.find((o) => o.valor === valor) ?? opciones[0]).valor;
}
