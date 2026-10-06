import type { InputHTMLAttributes, ReactNode, Ref } from "react";

import { clasesControl } from "./clasesControl";
import { MarcoCampo } from "./MarcoCampo";

export interface PropiedadesCampo extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string | undefined;
  ayuda?: ReactNode;
  /** Contenido a la derecha dentro del campo (por ejemplo, el botón de mostrar contraseña). */
  adorno?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

/** Campo de texto con etiqueta, ayuda y error asociados (BF-05, BF-11). */
export function Campo({ etiqueta, error, ayuda, adorno, id, className, ref, ...resto }: PropiedadesCampo) {
  return (
    <MarcoCampo etiqueta={etiqueta} error={error} ayuda={ayuda} id={id} className={className}>
      {(accesibles) => (
        <div className="relative">
          <input
            ref={ref}
            {...accesibles}
            className={clasesControl(error, adorno ? "pr-12" : undefined)}
            {...resto}
          />
          {adorno && <div className="absolute inset-y-0 right-0 flex items-center">{adorno}</div>}
        </div>
      )}
    </MarcoCampo>
  );
}
