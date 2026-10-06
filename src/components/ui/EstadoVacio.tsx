import type { ReactNode } from "react";

/** Estado vacío de una pantalla o lista (BF-09). */
export function EstadoVacio({
  icono,
  titulo,
  children,
}: {
  icono?: ReactNode;
  titulo: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-divisor px-6 py-12 text-center">
      {icono && <div className="text-acento-700">{icono}</div>}
      <h2 className="m-0 text-[22px]">{titulo}</h2>
      {children && <div className="max-w-md text-sm text-neutro-700">{children}</div>}
    </div>
  );
}
