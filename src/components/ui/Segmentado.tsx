import { cx } from "@/lib/clases";

interface PropiedadesSegmentado<T extends string> {
  etiqueta: string;
  valor: T;
  opciones: readonly { valor: T; etiqueta: string }[];
  alCambiar: (valor: T) => void;
}

/** Selector segmentado del prototipo (.seg): pocas opciones excluyentes, siempre visibles. */
export function Segmentado<T extends string>({
  etiqueta,
  valor,
  opciones,
  alCambiar,
}: PropiedadesSegmentado<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      className="inline-flex overflow-hidden rounded-md border border-divisor"
    >
      {opciones.map((o, i) => {
        const activo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => {
              alCambiar(o.valor);
            }}
            className={cx(
              "min-h-[40px] cursor-pointer px-3 text-[13px]",
              i > 0 && "border-l border-divisor",
              activo ? "bg-acento-700 text-fondo" : "hover:bg-tinta/7",
            )}
          >
            {o.etiqueta}
          </button>
        );
      })}
    </div>
  );
}
