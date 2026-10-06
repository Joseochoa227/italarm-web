import { Esqueleto } from "@/components/ui/Esqueleto";

import { TEXTOS_AUTH } from "../textos";

/** Esqueleto mientras se valida el token guardado (BF-09). */
export function PantallaCargaSesion() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh">
      <span className="sr-only">{TEXTOS_AUTH.cargando}</span>
      <div className="hidden w-[240px] flex-col gap-3 border-r border-divisor p-6 escritorio:flex">
        <Esqueleto className="h-7 w-32" />
        {Array.from({ length: 8 }, (_, i) => (
          <Esqueleto key={i} className="h-9 w-full" />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Esqueleto className="h-4 w-40" />
        <Esqueleto className="h-10 w-64" />
        <Esqueleto className="h-32 w-full" />
      </div>
    </div>
  );
}
