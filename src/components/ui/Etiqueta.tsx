import type { ReactNode } from "react";

import { cx } from "@/lib/clases";

type Tono = "acento" | "neutro" | "peligro" | "contorno";

const TONOS: Record<Tono, string> = {
  acento: "bg-acento-100 text-acento-800",
  neutro: "bg-neutro-100 text-neutro-800",
  peligro: "bg-peligro-100 text-peligro-800",
  contorno: "border border-acento text-acento-700",
};

/** Etiqueta corta de estado (tag del prototipo). */
export function Etiqueta({ tono = "neutro", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-[3px] px-2.5 py-px text-[11px] tracking-[0.02em]",
        TONOS[tono],
      )}
    >
      {children}
    </span>
  );
}
