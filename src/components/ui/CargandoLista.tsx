import { Esqueleto } from "./Esqueleto";

/** Esqueleto de un listado mientras carga (BF-09). */
export function CargandoLista({ filas = 5 }: { filas?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="flex flex-col gap-3">
      {Array.from({ length: filas }, (_, i) => (
        <Esqueleto key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
