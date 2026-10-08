import { X } from "lucide-react";
import { type Control, Controller, type FieldErrors, type UseFormRegister, useWatch } from "react-hook-form";

import type { components } from "@/api/esquema";
import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { SerialesQueSalen } from "@/features/comercial/components/SerialesQueSalen";
import { decimalAEdicion } from "@/lib/decimal";
import { formatearCantidad, formatearDineroDe, formatearFecha, separarMonedas } from "@/lib/formato";

import type { DatosVenta, EntradaVenta, Moneda } from "../schemas/venta";
import { TEXTOS_VENTAS } from "../textos";

const N = TEXTOS_VENTAS.nueva;
type Previa = components["schemas"]["LineaVistaPrevia"];
type Montos = components["schemas"]["MontoEnMonedas"] | undefined;
/** Equivalentes en pesos y bolívares (el costo en USD se muestra aparte). */
const sinUsd = (montos: Montos) =>
  [montos?.cop, montos?.ves].flatMap((d) => (d ? [formatearDineroDe(d)] : [])).join(" · ");

/** Costo en USD, a las tasas de hoy y a las de la última compra (RF-69, P-32). */
function CostoLinea({ previa }: { previa: Previa }) {
  const usd = previa.costoUnitarioHoy?.usd;
  if (!usd) return null;
  const hoy = sinUsd(previa.costoUnitarioHoy);
  const compra = sinUsd(previa.costoUnitarioUltimaCompra);
  const ultima = previa.ultimaCompra;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-sm bg-acento/7 px-2.5 py-1.5 text-xs text-neutro-800">
      <span>
        {N.costo} <strong>{formatearDineroDe(usd)}</strong>
      </span>
      {hoy && <span>{N.costoHoy(hoy)}</span>}
      {compra && ultima && (
        <span>
          {N.costoCompra(
            compra,
            [ultima.consecutivo, ultima.fecha ? formatearFecha(ultima.fecha) : null]
              .filter(Boolean)
              .join(" · "),
          )}
        </span>
      )}
    </div>
  );
}

/** Una línea de la venta (RF-99): precio, disponibilidad, costo, cantidad o seriales y subtotal. */
export function LineaVenta({
  indice,
  control,
  register,
  errores,
  previa,
  moneda,
  alQuitar,
}: {
  indice: number;
  control: Control<EntradaVenta, unknown, DatosVenta>;
  register: UseFormRegister<EntradaVenta>;
  errores: FieldErrors<EntradaVenta>["lineas"];
  previa: Previa | undefined;
  moneda: Moneda;
  alQuitar: () => void;
}) {
  const linea = useWatch({ control, name: `lineas.${indice}` });
  const error = errores?.[indice];
  const subtotal = separarMonedas(previa?.subtotal, moneda);
  const sugerido = previa?.precioSugerido;
  const unidad = linea.abreviatura;

  return (
    <li className="flex flex-col gap-2.5 border-t border-tinta/8 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-[160px] flex-1">
          <div className="font-medium">{linea.nombre}</div>
          <div className="text-xs text-neutro-700">
            {[
              linea.codigo,
              sugerido ? `${formatearDineroDe(sugerido)} / ${unidad}` : null,
              previa?.disponible === undefined
                ? null
                : N.disponible(`${formatearCantidad(previa.disponible)} ${unidad}`),
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        {!linea.controlaSerial && (
          <Campo
            etiqueta={N.etiquetaCantidad}
            aria-label={N.cantidad(linea.nombre)}
            inputMode={linea.admiteDecimales ? "decimal" : "numeric"}
            autoComplete="off"
            ayuda={unidad}
            error={error?.cantidad?.message}
            className="w-[110px]"
            {...register(`lineas.${indice}.cantidad`)}
          />
        )}
        <Campo
          etiqueta={N.etiquetaPrecio}
          aria-label={N.precio(linea.nombre)}
          inputMode="decimal"
          autoComplete="off"
          placeholder={sugerido?.monto ? decimalAEdicion(sugerido.monto) : ""}
          ayuda={sugerido ? N.precioAyuda(formatearDineroDe(sugerido)) : moneda}
          error={error?.precio?.message}
          className="w-[150px]"
          {...register(`lineas.${indice}.precio`)}
        />
        <div className="min-w-[120px] text-right">
          <div className="font-semibold">{subtotal.principal}</div>
          {subtotal.otros && <div className="text-[11px] text-acento-700">{subtotal.otros}</div>}
        </div>
        <Boton variante="fantasma" icono aria-label={N.quitar(linea.nombre)} onClick={alQuitar}>
          <X aria-hidden size={18} />
        </Boton>
      </div>
      {linea.controlaSerial && (
        <Controller
          control={control}
          name={`lineas.${indice}.seriales`}
          render={({ field }) => (
            <SerialesQueSalen
              productoId={linea.productoId}
              producto={linea.nombre}
              seleccionados={field.value}
              alCambiar={field.onChange}
              error={error?.seriales?.message}
            />
          )}
        />
      )}
      {previa?.avisoStock && (
        <Alerta tono="peligro" rol="alert">
          {previa.avisoStock}
        </Alerta>
      )}
      {previa?.avisoPrecio && (
        <Alerta tono="aviso" rol="status">
          {previa.avisoPrecio}
        </Alerta>
      )}
      {previa && <CostoLinea previa={previa} />}
    </li>
  );
}
