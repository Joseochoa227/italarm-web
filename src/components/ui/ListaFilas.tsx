import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

/**
 * Lista de registros como la del prototipo: filas que se acomodan en varias líneas en el celular y
 * en una sola en el computador. Cada fila es un enlace a su detalle o edición.
 */
export function ListaFilas({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <ul aria-label={etiqueta} className="m-0 flex list-none flex-col border-t border-divisor p-0">
      {children}
    </ul>
  );
}

export function FilaEnlace({ a, children, etiqueta }: { a: string; children: ReactNode; etiqueta: string }) {
  return (
    <li className="border-b border-divisor">
      <Link
        to={a}
        aria-label={etiqueta}
        className="flex items-center gap-3 px-2 py-4 text-tinta no-underline hover:bg-tenue hover:text-tinta"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2">{children}</div>
        <ChevronRight aria-hidden size={18} className="shrink-0 text-neutro-600" />
      </Link>
    </li>
  );
}
