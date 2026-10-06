import type { ReactNode, Ref, TextareaHTMLAttributes } from "react";

import { clasesControl } from "./clasesControl";
import { MarcoCampo } from "./MarcoCampo";

export interface PropiedadesAreaTexto extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta: string;
  error?: string | undefined;
  ayuda?: ReactNode;
  ref?: Ref<HTMLTextAreaElement>;
}

export function AreaTexto({ etiqueta, error, ayuda, id, className, ref, ...resto }: PropiedadesAreaTexto) {
  return (
    <MarcoCampo etiqueta={etiqueta} error={error} ayuda={ayuda} id={id} className={className}>
      {(accesibles) => (
        <textarea
          ref={ref}
          {...accesibles}
          className={clasesControl(error, "min-h-[90px] resize-y py-2")}
          {...resto}
        />
      )}
    </MarcoCampo>
  );
}
