import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";

import { cx } from "@/lib/clases";

export interface PropiedadesCampo extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string | undefined;
  ayuda?: ReactNode;
  /** Contenido a la derecha dentro del campo (por ejemplo, el botón de mostrar contraseña). */
  adorno?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

/** Campo con etiqueta, ayuda y error asociados al input (BF-05, BF-11). */
export function Campo({ etiqueta, error, ayuda, adorno, id, className, ref, ...resto }: PropiedadesCampo) {
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
      <div className="relative">
        <input
          ref={ref}
          id={idCampo}
          aria-invalid={error ? true : undefined}
          aria-describedby={descritoPor || undefined}
          className={cx(
            "min-h-[44px] w-full rounded-md border bg-superficie px-2.5 text-[15px] text-tinta caret-acento",
            "hover:border-tinta/45 focus-visible:border-acento focus-visible:outline-offset-0",
            error ? "border-peligro-700" : "border-divisor",
            adorno ? "pr-12" : undefined,
          )}
          {...resto}
        />
        {adorno && <div className="absolute inset-y-0 right-0 flex items-center">{adorno}</div>}
      </div>
      {ayuda && (
        <p id={idAyuda} className="text-xs text-neutro-700">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="text-xs font-medium text-peligro-700">
          {error}
        </p>
      )}
    </div>
  );
}
