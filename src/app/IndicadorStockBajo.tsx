import { useTotalStockBajo } from "@/features/inicio/hooks/inicio";
import { cx } from "@/lib/clases";

import { TEXTOS_NAVEGACION } from "./navegacion";

/**
 * Cantidad de productos bajo el mínimo junto a Inventario (RF-02, F6-06, W-13). Es la misma cifra
 * del bloque de Inicio y se actualiza al guardar cualquier documento.
 */
export function IndicadorStockBajo({ flotante = false }: { flotante?: boolean }) {
  const total = useTotalStockBajo();
  if (total <= 0) return null;
  return (
    <span
      className={cx(
        "inline-grid min-w-5 place-items-center rounded-full bg-acento-700 px-1.5 text-[11px] leading-5 font-semibold text-fondo",
        flotante && "absolute -top-1 left-1/2 ml-1.5",
      )}
    >
      <span aria-hidden>{total}</span>
      <span className="sr-only">{TEXTOS_NAVEGACION.bajoMinimo(total)}</span>
    </span>
  );
}
