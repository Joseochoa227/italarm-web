import type { ReactNode } from "react";

import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { Tarjeta } from "@/components/ui/Tarjeta";

/** Bloque de Inicio con título, resumen, enlace "Ver todo" y su contenido. */
export function Bloque({
  id,
  icono,
  titulo,
  resumen,
  enlace,
  children,
}: {
  id: string;
  icono?: ReactNode;
  titulo: string;
  resumen?: string | undefined;
  enlace?: { a: string; etiqueta: string } | undefined;
  children: ReactNode;
}) {
  return (
    <Tarjeta role="region" aria-labelledby={id} className="gap-3">
      <div className="flex items-center gap-2">
        {icono && <span className="text-acento-700">{icono}</span>}
        <div className="min-w-0 flex-1">
          <h2 id={id} className="m-0 text-[22px]">
            {titulo}
          </h2>
          {resumen && <p className="m-0 text-xs text-neutro-700">{resumen}</p>}
        </div>
        {enlace && (
          <EnlaceBoton a={enlace.a} variante="fantasma">
            {enlace.etiqueta}
          </EnlaceBoton>
        )}
      </div>
      {children}
    </Tarjeta>
  );
}
