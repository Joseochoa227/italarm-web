import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";

export interface PropiedadesCasilla extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

/** Casilla de verificación con área táctil de 44 px (BF-11). */
export function Casilla({ etiqueta, ayuda, id, ref, ...resto }: PropiedadesCasilla) {
  const generado = useId();
  const idCasilla = id ?? generado;
  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={idCasilla} className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm">
        <input
          ref={ref}
          id={idCasilla}
          type="checkbox"
          className="size-[18px] cursor-pointer accent-acento-700"
          {...resto}
        />
        <span>{etiqueta}</span>
      </label>
      {ayuda && <p className="m-0 pl-[28px] text-xs text-neutro-700">{ayuda}</p>}
    </div>
  );
}
