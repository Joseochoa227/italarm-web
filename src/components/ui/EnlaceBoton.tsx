import type { ReactNode } from "react";
import { Link } from "react-router";

import { cx } from "@/lib/clases";

const VARIANTES = {
  primario: "bg-acento-700 border-acento-700 text-fondo hover:bg-acento-800 hover:text-fondo",
  secundario: "border-divisor text-tinta hover:bg-tinta/7 hover:text-tinta",
} as const;

/** Enlace con forma de botón (navega a otra pantalla), con el mismo aspecto que Boton. */
export function EnlaceBoton({
  a,
  icono,
  variante = "secundario",
  children,
}: {
  a: string;
  icono?: ReactNode;
  variante?: keyof typeof VARIANTES;
  children: ReactNode;
}) {
  return (
    <Link
      to={a}
      className={cx(
        "inline-flex min-h-[44px] items-center gap-1.5 rounded-md border px-4 font-titulo text-[15px] font-semibold no-underline",
        VARIANTES[variante],
      )}
    >
      {icono}
      {children}
    </Link>
  );
}
