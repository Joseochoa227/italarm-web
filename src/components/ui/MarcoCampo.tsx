import { useId, type ReactNode } from "react";

import { cx } from "@/lib/clases";

export interface PropsAccesibles {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
}

interface PropiedadesMarco {
  etiqueta: string;
  error?: string | undefined;
  ayuda?: ReactNode;
  id?: string | undefined;
  className?: string | undefined;
  /** Recibe id, aria-invalid y aria-describedby para el control. */
  children: (props: PropsAccesibles) => ReactNode;
}

/** Etiqueta, ayuda y error asociados a un control (BF-05, BF-11). */
export function MarcoCampo({ etiqueta, error, ayuda, id, className, children }: PropiedadesMarco) {
  const generado = useId();
  const idCampo = id ?? generado;
  const idAyuda = `${idCampo}-ayuda`;
  const idError = `${idCampo}-error`;
  const descritoPor = [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(" ");
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <label htmlFor={idCampo} className="text-xs text-tinta/70">
        {etiqueta}
      </label>
      {children({
        id: idCampo,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": descritoPor || undefined,
      })}
      {ayuda && (
        <p id={idAyuda} className="m-0 text-xs text-neutro-700">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="m-0 text-xs font-medium text-peligro-700">
          {error}
        </p>
      )}
    </div>
  );
}
