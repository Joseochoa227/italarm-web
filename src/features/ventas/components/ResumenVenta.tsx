import { type Control, Controller, type FieldErrors, type UseFormRegister, useWatch } from "react-hook-form";

import type { components } from "@/api/esquema";
import { Alerta } from "@/components/ui/Alerta";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { Campo } from "@/components/ui/Campo";
import { Casilla } from "@/components/ui/Casilla";
import { Segmentado } from "@/components/ui/Segmentado";
import { formatearDecimal, separarMonedas } from "@/lib/formato";

import { type DatosVenta, type EntradaVenta, type Moneda, MONEDAS, TIPOS_DESCUENTO } from "../schemas/venta";
import { TEXTOS_VENTAS } from "../textos";

const N = TEXTOS_VENTAS.nueva;
const DESCUENTOS = TIPOS_DESCUENTO.map((valor) => ({ valor, etiqueta: N.descuentos[valor] }));

function Fila({ titulo, valor, otros }: { titulo: string; valor: string; otros?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-neutro-700">{titulo}</span>
      <span className="text-right">
        {valor}
        {otros && <span className="block text-[11px] text-neutro-700">{otros}</span>}
      </span>
    </div>
  );
}

/**
 * Resumen de la venta (RF-100): subtotal, descuento, total de contado en las tres monedas, costo y
 * utilidad, tal como los calcula el backend (BF-06), más las opciones del comprobante (P-34).
 */
export function ResumenVenta({
  resumen,
  moneda,
  control,
  register,
  errores,
}: {
  resumen: components["schemas"]["ResumenCobroVista"] | undefined;
  moneda: Moneda;
  control: Control<EntradaVenta, unknown, DatosVenta>;
  register: UseFormRegister<EntradaVenta>;
  errores: FieldErrors<EntradaVenta>;
}) {
  const tipoDescuento = useWatch({ control, name: "descuentoTipo" });
  const total = separarMonedas(resumen?.total, moneda);
  const subtotal = separarMonedas(resumen?.subtotal, moneda);
  const descuento = separarMonedas(resumen?.descuento, moneda);
  const costo = separarMonedas(resumen?.costo, moneda);
  const utilidad = separarMonedas(resumen?.utilidad, moneda);

  return (
    <div className="flex flex-col gap-3">
      <Fila titulo={N.subtotal} valor={subtotal.principal} />
      <div className="flex flex-col gap-2">
        <span className="text-sm text-neutro-700">{N.descuento}</span>
        <Controller
          control={control}
          name="descuentoTipo"
          render={({ field }) => (
            <Segmentado
              etiqueta={N.descuento}
              valor={field.value}
              opciones={DESCUENTOS}
              alCambiar={field.onChange}
            />
          )}
        />
        {tipoDescuento !== "NINGUNO" && (
          <Campo
            etiqueta={N.descuentoValor}
            inputMode="decimal"
            autoComplete="off"
            ayuda={tipoDescuento === "PORCENTAJE" ? "%" : moneda}
            error={errores.descuentoValor?.message}
            {...register("descuentoValor")}
          />
        )}
        {resumen?.descuento && tipoDescuento !== "NINGUNO" && (
          <Fila titulo={N.descuento} valor={`− ${descuento.principal}`} />
        )}
      </div>
      <output aria-label={N.total} className="flex flex-col border-t border-divisor pt-3">
        <span className="text-sm text-neutro-700">{N.total}</span>
        <span className="font-titulo text-[36px] leading-tight font-semibold">{total.principal}</span>
        {total.otros && <span className="text-[13px] text-acento-700">{total.otros}</span>}
      </output>
      <Fila titulo={N.costoMaterial} valor={costo.principal} />
      <Fila
        titulo={N.utilidad}
        valor={`${utilidad.principal}${resumen?.porcentajeUtilidad ? ` · ${formatearDecimal(resumen.porcentajeUtilidad)} %` : ""}`}
      />
      <fieldset className="m-0 flex flex-col border-0 p-0">
        <legend className="mb-1 text-xs text-tinta/70">{N.comprobante}</legend>
        <Controller
          control={control}
          name="monedasComprobante"
          render={({ field }) => (
            <div className="flex flex-wrap gap-x-4">
              {MONEDAS.filter((m) => m !== moneda).map((m) => (
                <Casilla
                  key={m}
                  etiqueta={m}
                  checked={field.value.includes(m)}
                  onChange={(e) => {
                    field.onChange(
                      e.target.checked ? [...field.value, m] : field.value.filter((x) => x !== m),
                    );
                  }}
                />
              ))}
            </div>
          )}
        />
      </fieldset>
      <AreaTexto
        etiqueta={N.observaciones}
        maxLength={500}
        rows={2}
        error={errores.observaciones?.message}
        {...register("observaciones")}
      />
      {errores.descuentoValor && tipoDescuento === "NINGUNO" && (
        <Alerta tono="peligro" rol="alert">
          {errores.descuentoValor.message}
        </Alerta>
      )}
    </div>
  );
}
