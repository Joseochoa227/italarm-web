import type { ReactNode } from "react";

/** Tabla del prototipo (.table): encabezados en versalitas y desplazamiento horizontal en el celular. */
export function Tabla({
  etiqueta,
  columnas,
  children,
}: {
  etiqueta: string;
  columnas: readonly string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table aria-label={etiqueta} className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-divisor text-left text-[11px] tracking-[0.08em] text-tinta/60 uppercase">
            {columnas.map((c) => (
              <th key={c} scope="col" className="p-2 font-normal whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Celda({ children, derecha = false }: { children: ReactNode; derecha?: boolean }) {
  return <td className={derecha ? "p-2 text-right whitespace-nowrap" : "p-2"}>{children}</td>;
}
