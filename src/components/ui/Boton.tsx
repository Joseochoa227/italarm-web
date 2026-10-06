import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "@/lib/clases";

type Variante = "primario" | "secundario" | "fantasma" | "peligro";

const VARIANTES: Record<Variante, string> = {
  // El fondo del primario es acento-700 y no el #5980a6 del prototipo: con texto claro,
  // #5980a6 da un contraste de 3,7:1 y BF-11 pide 4,5:1.
  primario: "bg-acento-700 text-fondo border-acento-700 hover:bg-acento-800 active:bg-acento-900",
  secundario: "border-divisor text-tinta hover:bg-tinta/7 active:bg-tinta/14",
  fantasma: "border-transparent text-acento-700 hover:bg-acento/10 active:bg-acento/18",
  peligro: "bg-peligro-700 text-fondo border-peligro-700 hover:bg-peligro-800 active:bg-peligro-900",
};

export interface PropiedadesBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  /** Muestra el indicador de carga y deshabilita el botón (BF-10). */
  ocupado?: boolean;
  /** Botón cuadrado de solo ícono; exige aria-label. */
  icono?: boolean;
  bloque?: boolean;
  children?: ReactNode;
}

export function Boton({
  variante = "secundario",
  ocupado = false,
  icono = false,
  bloque = false,
  disabled,
  className,
  children,
  type = "button",
  ...resto
}: PropiedadesBoton) {
  return (
    <button
      type={type}
      disabled={disabled === true || ocupado}
      aria-busy={ocupado || undefined}
      className={cx(
        "inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-md border font-titulo text-[15px] leading-tight font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        icono ? "min-w-[44px] p-0" : "px-4",
        bloque && "w-full",
        VARIANTES[variante],
        className,
      )}
      {...resto}
    >
      {ocupado && <LoaderCircle aria-hidden size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
