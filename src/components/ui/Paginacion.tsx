import { ChevronLeft, ChevronRight } from "lucide-react";

import { Boton } from "./Boton";

/** Paginación de los listados (RT-04). `pagina` empieza en 1, como se muestra al usuario. */
export function Paginacion({
  pagina,
  totalPaginas,
  alCambiar,
}: {
  pagina: number;
  totalPaginas: number;
  alCambiar: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;
  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-3">
      <Boton
        variante="fantasma"
        disabled={pagina <= 1}
        onClick={() => {
          alCambiar(pagina - 1);
        }}
      >
        <ChevronLeft aria-hidden size={16} />
        Anterior
      </Boton>
      <span className="text-sm text-neutro-700" aria-current="page">
        Página {pagina} de {totalPaginas}
      </span>
      <Boton
        variante="fantasma"
        disabled={pagina >= totalPaginas}
        onClick={() => {
          alCambiar(pagina + 1);
        }}
      >
        Siguiente
        <ChevronRight aria-hidden size={16} />
      </Boton>
    </nav>
  );
}
