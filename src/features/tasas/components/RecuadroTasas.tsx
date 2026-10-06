import { TriangleAlert } from "lucide-react";
import { Link } from "react-router";

import { cx } from "@/lib/clases";
import { formatearDecimal } from "@/lib/formato";

import { type TasaVigente, useTasasVigentes } from "../hooks/consultasTasas";
import { TEXTOS_TASAS } from "../textos";

function valor(tasa: TasaVigente | undefined) {
  return tasa?.valor ? formatearDecimal(tasa.valor) : "—";
}

/** Recuadro "Tasas de hoy" al pie del menú lateral (RF-01, RF-30). Lleva a la pantalla de tasas. */
export function RecuadroTasas() {
  const { data } = useTasasVigentes();
  const aviso = data?.trm?.aviso ?? data?.bolivar?.aviso;
  return (
    <Link
      to="/tasas"
      aria-label={`${TEXTOS_TASAS.recuadro}: COP ${valor(data?.trm)}, VES ${valor(data?.bolivar)}${aviso ? `. ${aviso}` : ""}`}
      className="flex flex-col gap-1.5 rounded-lg border border-borde bg-tarjeta px-4 py-3 text-tinta no-underline hover:border-divisor hover:text-tinta"
    >
      <span className="text-[10px] tracking-[0.1em] text-acento-700 uppercase">{TEXTOS_TASAS.recuadro}</span>
      {(
        [
          ["COP", data?.trm],
          ["VES", data?.bolivar],
        ] as const
      ).map(([moneda, tasa]) => (
        <span key={moneda} className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-neutro-700">{moneda}</span>
          <span className="font-titulo text-lg font-semibold">{valor(tasa)}</span>
        </span>
      ))}
      {aviso && (
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-acento-900">
          <TriangleAlert aria-hidden size={14} />
          Actualizar tasa
        </span>
      )}
    </Link>
  );
}

/** Tasas en la barra superior del celular (RF-03). */
export function TasasBarra() {
  const { data } = useTasasVigentes();
  return (
    <Link
      to="/tasas"
      aria-label={`${TEXTOS_TASAS.titulo}: COP ${valor(data?.trm)}, VES ${valor(data?.bolivar)}`}
      className="flex flex-col items-end gap-px py-1 text-xs leading-tight text-tinta no-underline hover:text-tinta"
    >
      {(
        [
          ["COP", data?.trm],
          ["VES", data?.bolivar],
        ] as const
      ).map(([moneda, tasa]) => (
        <span key={moneda} className="flex items-center gap-1">
          {tasa?.aviso && <TriangleAlert aria-hidden size={12} className="text-acento-900" />}
          <span className="text-neutro-700">{moneda}</span>
          <strong className={cx(tasa?.aviso && "text-acento-900")}>{valor(tasa)}</strong>
        </span>
      ))}
    </Link>
  );
}
