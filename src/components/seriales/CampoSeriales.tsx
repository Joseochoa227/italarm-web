import { CircleCheck, ScanBarcode } from "lucide-react";
import { useId, useState } from "react";

import { Boton } from "@/components/ui/Boton";
import { cx } from "@/lib/clases";
import { normalizarSerial, serialesRepetidos } from "@/lib/seriales";

import { Escaner } from "./Escaner";
import { TEXTOS_SERIALES } from "./textos";

/**
 * Seriales de las unidades que entran (RF-20, RF-43, RF-59): una casilla por unidad, escritos a mano
 * o leídos con la cámara (BF-14, W-07). Se normalizan al salir de cada casilla (P-22) y se marcan
 * los repetidos.
 */
export function CampoSeriales({
  producto,
  valores,
  alCambiar,
  error,
}: {
  /** Nombre del producto, para las etiquetas accesibles. */
  producto: string;
  valores: string[];
  alCambiar: (valores: string[]) => void;
  error?: string | undefined;
}) {
  const id = useId();
  const [escaneando, setEscaneando] = useState(false);
  const repetidos = serialesRepetidos(valores);
  const llenos = valores.filter((v) => v.trim() !== "").length;
  const completos = llenos === valores.length && repetidos.size === 0;

  const cambiar = (indice: number, valor: string) => {
    alCambiar(valores.map((v, i) => (i === indice ? valor : v)));
  };

  return (
    <fieldset
      className="m-0 flex flex-col gap-2 rounded-md border border-divisor p-3"
      aria-describedby={`${id}-estado`}
    >
      <legend className="px-1 text-xs">
        {TEXTOS_SERIALES.titulo} · {producto}
      </legend>
      <div className="flex flex-wrap items-center gap-2">
        <span
          id={`${id}-estado`}
          className={cx("text-sm", completos ? "font-medium text-acento-700" : "text-neutro-700")}
        >
          {completos ? (
            <span className="inline-flex items-center gap-1">
              <CircleCheck aria-hidden size={14} />
              {TEXTOS_SERIALES.completos}
            </span>
          ) : (
            `${TEXTOS_SERIALES.titulo} · ${TEXTOS_SERIALES.progreso(llenos, valores.length)}`
          )}
        </span>
        <Boton
          variante="fantasma"
          className="ml-auto"
          disabled={llenos === valores.length}
          onClick={() => {
            setEscaneando(true);
          }}
        >
          <ScanBarcode aria-hidden size={16} />
          {TEXTOS_SERIALES.escanear}
        </Boton>
      </div>
      <div className="grid gap-2 escritorio:grid-cols-2">
        {valores.map((valor, i) => {
          const repetido = valor.trim() !== "" && repetidos.has(normalizarSerial(valor));
          return (
            <div key={i} className="flex flex-col gap-0.5">
              <input
                aria-label={`${TEXTOS_SERIALES.unidad(i + 1)} de ${producto}`}
                aria-invalid={repetido || undefined}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                value={valor}
                placeholder={TEXTOS_SERIALES.unidad(i + 1)}
                onChange={(e) => {
                  cambiar(i, e.target.value);
                }}
                onBlur={(e) => {
                  cambiar(i, normalizarSerial(e.target.value));
                }}
                className={cx(
                  "min-h-[44px] w-full rounded-md border bg-superficie px-2.5 font-mono text-sm text-tinta uppercase",
                  repetido ? "border-peligro-700" : "border-divisor",
                )}
              />
              {repetido && (
                <span className="text-xs font-medium text-peligro-700">{TEXTOS_SERIALES.repetido}</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="m-0 text-xs text-neutro-700">{TEXTOS_SERIALES.ayuda}</p>
      {error && (
        <p role="alert" className="m-0 text-xs font-medium text-peligro-700">
          {error}
        </p>
      )}
      {escaneando && (
        <Escaner
          alCerrar={() => {
            setEscaneando(false);
          }}
          alLeer={(texto) => {
            const libre = valores.findIndex((v) => v.trim() === "");
            if (libre >= 0) cambiar(libre, normalizarSerial(texto));
            setEscaneando(false);
          }}
        />
      )}
    </fieldset>
  );
}
