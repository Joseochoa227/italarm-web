/**
 * Quita las propiedades undefined: con exactOptionalPropertyTypes, un campo opcional vacío no se
 * envía (el backend lo guarda como vacío).
 */
export function sinIndefinidos<T extends object>(objeto: T): { [K in keyof T]: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(objeto).filter(([, v]) => v !== undefined)) as {
    [K in keyof T]: Exclude<T[K], undefined>;
  };
}
