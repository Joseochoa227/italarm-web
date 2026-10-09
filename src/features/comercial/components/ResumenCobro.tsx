import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import type { components } from "@/api/esquema";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { Campo } from "@/components/ui/Campo";
import { Casilla } from "@/components/ui/Casilla";
import { Segmentado } from "@/components/ui/Segmentado";
import { formatearDecimal, separarMonedas } from "@/lib/formato";

import { type Moneda, MONEDAS, type TipoDescuento, TIPOS_DESCUENTO } from "../schemas/material";
import { TEXTOS_COMERCIAL } from "../textos";

const C = TEXTOS_COMERCIAL.cobro;
const DESCUENTOS = TIPOS_DESCUENTO.map((valor) => ({ valor, etiqueta: C.descuentos[valor] }));

function Fila({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-neutro-700">{titulo}</span>
      <span className="text-right">{valor}</span>
    </div>
  );
}

/**
 * Resumen del cobro (RF-100, RF-117 a RF-119): material, mano de obra (instalaciones), subtotal,
 * descuento, total de contado en las tres monedas, costo y utilidad, tal como los calcula el backend
 * (BF-06), más las opciones del comprobante (P-34).
 */
export function ResumenCobro({
  resumen,
  moneda,
  manoDeObra,
  descuento,
  monedasComprobante,
  registroObservaciones,
  errorObservaciones,
}: {
  resumen: components["schemas"]["ResumenCobroVista"] | undefined;
  moneda: Moneda;
  /** Campo de mano de obra (instalaciones); sin él, el resumen es el de una venta. */
  manoDeObra?: ReactNode;
  descuento: {
    tipo: TipoDescuento;
    alCambiarTipo: (tipo: TipoDescuento) => void;
    registroValor: UseFormRegisterReturn;
    error?: string | undefined;
  };
  monedasComprobante: { valor: Moneda[]; alCambiar: (monedas: Moneda[]) => void };
  registroObservaciones: UseFormRegisterReturn;
  errorObservaciones?: string | undefined;
}) {
  const en = (montos: components["schemas"]["MontoEnMonedas"] | undefined) => separarMonedas(montos, moneda);
  const total = en(resumen?.total);
  return (
    <div className="flex flex-col gap-3">
      {manoDeObra && (
        <>
          <Fila titulo={C.material} valor={en(resumen?.material).principal} />
          {manoDeObra}
        </>
      )}
      <Fila titulo={C.subtotal} valor={en(resumen?.subtotal).principal} />
      <div className="flex flex-col gap-2">
        <span className="text-sm text-neutro-700">{C.descuento}</span>
        <Segmentado
          etiqueta={C.descuento}
          valor={descuento.tipo}
          opciones={DESCUENTOS}
          alCambiar={descuento.alCambiarTipo}
        />
        {descuento.tipo !== "NINGUNO" && (
          <Campo
            etiqueta={C.descuentoValor}
            inputMode="decimal"
            autoComplete="off"
            ayuda={descuento.tipo === "PORCENTAJE" ? "%" : moneda}
            error={descuento.error}
            {...descuento.registroValor}
          />
        )}
        {resumen?.descuento && descuento.tipo !== "NINGUNO" && (
          <Fila titulo={C.descuento} valor={`− ${en(resumen.descuento).principal}`} />
        )}
      </div>
      <output aria-label={C.total} className="flex flex-col border-t border-divisor pt-3">
        <span className="text-sm text-neutro-700">{C.total}</span>
        <span className="font-titulo text-[36px] leading-tight font-semibold">{total.principal}</span>
        {total.otros && <span className="text-[13px] text-acento-700">{total.otros}</span>}
      </output>
      <Fila titulo={C.costoMaterial} valor={en(resumen?.costo).principal} />
      <Fila
        titulo={C.utilidad}
        valor={`${en(resumen?.utilidad).principal}${resumen?.porcentajeUtilidad ? ` · ${formatearDecimal(resumen.porcentajeUtilidad)} %` : ""}`}
      />
      <fieldset className="m-0 flex flex-col border-0 p-0">
        <legend className="mb-1 text-xs text-tinta/70">{C.comprobante}</legend>
        <div className="flex flex-wrap gap-x-4">
          {MONEDAS.filter((m) => m !== moneda).map((m) => (
            <Casilla
              key={m}
              etiqueta={m}
              checked={monedasComprobante.valor.includes(m)}
              onChange={(e) => {
                const actuales = monedasComprobante.valor;
                monedasComprobante.alCambiar(
                  e.target.checked ? [...actuales, m] : actuales.filter((x) => x !== m),
                );
              }}
            />
          ))}
        </div>
      </fieldset>
      <AreaTexto
        etiqueta={C.observaciones}
        maxLength={500}
        rows={2}
        error={errorObservaciones}
        {...registroObservaciones}
      />
    </div>
  );
}
