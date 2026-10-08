import type { components } from "@/api/esquema";
import { formatearDecimal } from "@/lib/formato";

/** Tasas guardadas en la compra: "TRM 4.000 · Bs 50". */
export function textoTasas(tasas: components["schemas"]["TasasCompraVista"] | undefined): string {
  return (
    [
      tasas?.trm ? `TRM ${formatearDecimal(tasas.trm)}` : null,
      tasas?.tasaVes ? `Bs ${formatearDecimal(tasas.tasaVes)}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "—"
  );
}
