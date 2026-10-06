import type { ReactNode, Ref, SelectHTMLAttributes } from "react";

import { clasesControl } from "./clasesControl";
import { MarcoCampo } from "./MarcoCampo";

export interface PropiedadesSelector extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string;
  error?: string | undefined;
  ayuda?: ReactNode;
  opciones: readonly { valor: string; etiqueta: string }[];
  /** Texto de la opción vacía; si no se da, no hay opción vacía. */
  vacio?: string;
  ref?: Ref<HTMLSelectElement>;
}

/** Selector nativo: accesible y cómodo en el celular. */
export function Selector({
  etiqueta,
  error,
  ayuda,
  opciones,
  vacio,
  id,
  className,
  ref,
  ...resto
}: PropiedadesSelector) {
  return (
    <MarcoCampo etiqueta={etiqueta} error={error} ayuda={ayuda} id={id} className={className}>
      {(accesibles) => (
        <select ref={ref} {...accesibles} className={clasesControl(error, "cursor-pointer")} {...resto}>
          {vacio !== undefined && <option value="">{vacio}</option>}
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      )}
    </MarcoCampo>
  );
}
