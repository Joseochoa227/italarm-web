import { X } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";

import type { components } from "@/api/esquema";
import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { decimalAEdicion } from "@/lib/decimal";
import { formatearCantidad, formatearDineroDe, formatearFecha, separarMonedas } from "@/lib/formato";

import type { EntradaLineaMaterial, Moneda } from "../schemas/material";
import { TEXTOS_COMERCIAL } from "../textos";
import { SerialesQueSalen } from "./SerialesQueSalen";

const N = TEXTOS_COMERCIAL.material;
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

/**
 * Una línea de material de una venta, instalación o cotización (RF-99, RF-108): precio sugerido
 * editable, disponibilidad, costo, cantidad o seriales que salen, subtotal y avisos, tal como los
 * da la vista previa del backend.
 */
export function LineaMaterial({
  linea,
  previa,
  moneda,
  registroCantidad,
  registroPrecio,
  seriales,
  errores,
  alQuitar,
}: {
  linea: EntradaLineaMaterial;
  previa: Previa | undefined;
  moneda: Moneda;
  registroCantidad: UseFormRegisterReturn;
  registroPrecio: UseFormRegisterReturn;
  seriales: { valor: string[]; alCambiar: (seriales: string[]) => void };
  errores:
    { cantidad?: string | undefined; precio?: string | undefined; seriales?: string | undefined } | undefined;
  alQuitar: () => void;
}) {
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
            error={errores?.cantidad}
            className="w-[110px]"
            {...registroCantidad}
          />
        )}
        <Campo
          etiqueta={N.etiquetaPrecio}
          aria-label={N.precio(linea.nombre)}
          inputMode="decimal"
          autoComplete="off"
          placeholder={sugerido?.monto ? decimalAEdicion(sugerido.monto) : ""}
          ayuda={sugerido ? N.precioAyuda(formatearDineroDe(sugerido)) : moneda}
          error={errores?.precio}
          className="w-[150px]"
          {...registroPrecio}
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
        <SerialesQueSalen
          productoId={linea.productoId}
          producto={linea.nombre}
          seleccionados={seriales.valor}
          alCambiar={seriales.alCambiar}
          error={errores?.seriales}
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
