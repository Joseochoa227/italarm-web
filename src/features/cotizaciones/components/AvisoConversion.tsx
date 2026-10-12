import { Link } from "react-router";

import { Alerta } from "@/components/ui/Alerta";

import type { Conversion } from "../conversion";
import { TEXTOS_COTIZACIONES } from "../textos";

const C = TEXTOS_COTIZACIONES.conversion;

/**
 * Encabezado del formulario de venta o instalación que viene de una cotización (RF-93 a RF-96):
 * de cuál viene y los avisos del backend (precio, costo, stock, producto inactivo y tasa).
 */
export function AvisoConversion({ conversion }: { conversion: Conversion }) {
  return (
    <div className="flex flex-col gap-2">
      <Alerta tono="info">
        <span className="flex flex-col gap-0.5">
          <strong>
            <Link to={`/cotizaciones/${String(conversion.cotizacionId)}`}>
              {C.desde(conversion.consecutivo ?? "")}
            </Link>
          </strong>
          <span>{C.nota}</span>
        </span>
      </Alerta>
      {(conversion.avisos ?? []).map((a, i) => (
        <Alerta key={`${a.tipo ?? ""}-${String(a.productoId ?? i)}`} tono="aviso" rol="status">
          {a.mensaje}
        </Alerta>
      ))}
      {conversion.puedeGuardar === false && (
        <Alerta tono="peligro" rol="alert">
          {C.sinStock}
        </Alerta>
      )}
    </div>
  );
}
