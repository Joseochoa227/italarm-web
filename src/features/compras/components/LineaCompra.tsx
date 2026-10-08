import { X } from "lucide-react";
import { type Control, Controller, type FieldErrors, type UseFormRegister, useWatch } from "react-hook-form";

import type { components } from "@/api/esquema";
import { CampoSeriales } from "@/components/seriales/CampoSeriales";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { TEXTOS_INVENTARIO } from "@/features/inventario/textosInventario";
import { formatearCantidad, formatearDineroDe, type Moneda } from "@/lib/formato";
import { ajustarSeriales, unidadesDe } from "@/lib/seriales";

import { type DatosCompra, type EntradaCompra, leerCantidad } from "../schemas/compra";
import { TEXTOS_COMPRAS } from "../textos";

const N = TEXTOS_COMPRAS.nueva;
type Previa = components["schemas"]["VistaPreviaCompraVistaLinea"];
type Errores = FieldErrors<EntradaCompra>;

/** Monto en la moneda de la factura en grande y los equivalentes debajo. */
function Subtotal({ previa, moneda }: { previa: Previa | undefined; moneda: Moneda }) {
  const montos = previa?.subtotal;
  const clave = moneda === "USD" ? "usd" : moneda === "COP" ? "cop" : "ves";
  const principal = montos?.[clave];
  const otros = (["usd", "cop", "ves"] as const)
    .filter((c) => c !== clave)
    .flatMap((c) => (montos?.[c] ? [formatearDineroDe(montos[c])] : []));
  return (
    <div className="min-w-[120px] text-right">
      <div className="font-semibold">{principal ? formatearDineroDe(principal) : "—"}</div>
      {otros.length > 0 && <div className="text-[11px] text-acento-700">{otros.join(" · ")}</div>}
    </div>
  );
}

/** Cambio de costo que hará la compra según la vista previa (RF-41): "Costo US$ 20 → US$ 19,50". */
function CambioCosto({ previa }: { previa: Previa | undefined }) {
  if (!previa?.costoNuevoUsd) return null;
  const nuevo = formatearDineroDe(previa.costoNuevoUsd);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm bg-acento/7 px-2.5 py-1.5 text-xs">
      <strong>
        {previa.costoActualUsd
          ? N.cambioCosto(formatearDineroDe(previa.costoActualUsd), nuevo)
          : N.costoNuevo(nuevo)}
      </strong>
      {previa.regla && <Etiqueta>{TEXTOS_INVENTARIO.reglas[previa.regla] ?? previa.regla}</Etiqueta>}
      {previa.stockActual !== undefined && (
        <span className="text-neutro-700">
          {N.stockActual(`${formatearCantidad(previa.stockActual)} ${previa.abreviatura ?? ""}`)}
        </span>
      )}
    </div>
  );
}

/** Una línea de la compra: cantidad, costo unitario, subtotal, cambio de costo y seriales (RF-43). */
export function LineaCompra({
  indice,
  control,
  register,
  errores,
  previa,
  moneda,
  alQuitar,
}: {
  indice: number;
  control: Control<EntradaCompra, unknown, DatosCompra>;
  register: UseFormRegister<EntradaCompra>;
  errores: Errores["lineas"];
  previa: Previa | undefined;
  moneda: Moneda;
  alQuitar: () => void;
}) {
  const linea = useWatch({ control, name: `lineas.${indice}` });
  const error = errores?.[indice];
  const cantidad = leerCantidad(linea.cantidad, linea.admiteDecimales);
  const unidades = typeof cantidad === "string" ? unidadesDe(cantidad) : 0;

  return (
    <li className="flex flex-col gap-2.5 border-t border-tinta/8 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-[160px] flex-1">
          <div className="font-medium">{linea.nombre}</div>
          <div className="text-xs text-neutro-700">{linea.codigo}</div>
        </div>
        <Campo
          etiqueta={N.etiquetaCantidad}
          aria-label={N.cantidad(linea.nombre)}
          inputMode={linea.admiteDecimales ? "decimal" : "numeric"}
          autoComplete="off"
          ayuda={linea.abreviatura}
          error={error?.cantidad?.message}
          className="w-[110px]"
          {...register(`lineas.${indice}.cantidad`)}
        />
        <Campo
          etiqueta={N.etiquetaCosto}
          aria-label={N.costo(linea.nombre)}
          inputMode="decimal"
          autoComplete="off"
          ayuda={N.costoAyuda(moneda, linea.abreviatura)}
          error={error?.costoUnitario?.message}
          className="w-[140px]"
          {...register(`lineas.${indice}.costoUnitario`)}
        />
        <Subtotal previa={previa} moneda={moneda} />
        <Boton variante="fantasma" icono aria-label={N.quitar(linea.nombre)} onClick={alQuitar}>
          <X aria-hidden size={18} />
        </Boton>
      </div>
      <CambioCosto previa={previa} />
      {linea.controlaSerial && unidades > 0 && (
        <Controller
          control={control}
          name={`lineas.${indice}.seriales`}
          render={({ field }) => (
            <CampoSeriales
              producto={linea.nombre}
              valores={ajustarSeriales(field.value, unidades)}
              alCambiar={field.onChange}
              error={error?.seriales?.message}
            />
          )}
        />
      )}
    </li>
  );
}
