import { Link } from "react-router";

import { cx } from "@/lib/clases";

/**
 * Pestañas de una pantalla guardadas en la URL (?pestana=…): se pueden enlazar y el botón Atrás
 * vuelve a la anterior.
 */
export function Pestanas<T extends string>({
  etiqueta,
  activa,
  opciones,
  ruta,
}: {
  etiqueta: string;
  activa: T;
  opciones: readonly { valor: T; etiqueta: string }[];
  ruta: string;
}) {
  return (
    <nav aria-label={etiqueta} className="flex gap-1 overflow-x-auto border-b border-divisor">
      {opciones.map((o) => {
        const actual = o.valor === activa;
        return (
          <Link
            key={o.valor}
            to={`${ruta}?pestana=${o.valor}`}
            replace
            aria-current={actual ? "page" : undefined}
            className={cx(
              "-mb-px flex min-h-[44px] items-center border-b-2 px-3 text-sm whitespace-nowrap no-underline",
              actual
                ? "border-acento-700 font-semibold text-acento-800 hover:text-acento-800"
                : "border-transparent text-neutro-700 hover:text-tinta",
            )}
          >
            {o.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
