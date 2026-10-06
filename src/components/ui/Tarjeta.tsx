import type { HTMLAttributes } from "react";

import { cx } from "@/lib/clases";

/** Tarjeta de las pantallas del prototipo: fondo #fafafb, borde tenue y sombra suave. */
export function Tarjeta({ className, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("flex flex-col gap-3 rounded-lg border border-borde bg-tarjeta p-6 shadow-sm", className)}
      {...resto}
    />
  );
}
