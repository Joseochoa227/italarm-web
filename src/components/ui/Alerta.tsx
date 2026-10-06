import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cx } from "@/lib/clases";

type Tono = "info" | "aviso" | "peligro";

const ESTILOS: Record<Tono, { caja: string; icono: ReactNode }> = {
  info: {
    caja: "bg-acento-100 text-acento-900",
    icono: <Info aria-hidden size={18} className="shrink-0 text-acento-700" />,
  },
  // Avisos del prototipo: azul acento-200 con texto acento-900.
  aviso: {
    caja: "bg-acento-200 text-acento-900",
    icono: <TriangleAlert aria-hidden size={18} className="shrink-0 text-acento-900" />,
  },
  peligro: {
    caja: "bg-peligro-100 text-peligro-900",
    icono: <CircleAlert aria-hidden size={18} className="shrink-0 text-peligro-700" />,
  },
};

/** Mensaje destacado dentro de una pantalla o formulario. */
export function Alerta({
  tono = "info",
  children,
  accion,
  rol,
}: {
  tono?: Tono;
  children: ReactNode;
  accion?: ReactNode;
  /** "alert" para errores que deben anunciarse; "status" para avisos; ninguno para textos fijos. */
  rol?: "alert" | "status";
}) {
  const { caja, icono } = ESTILOS[tono];
  return (
    <div role={rol} className={cx("flex flex-wrap items-center gap-3 rounded-md px-4 py-3 text-sm", caja)}>
      {icono}
      <div className="min-w-[200px] flex-1">{children}</div>
      {accion}
    </div>
  );
}
