import { Alerta } from "@/components/ui/Alerta";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { mensajeDeError } from "@/lib/errores";

import { TEXTOS_COTIZACIONES } from "../textos";

const C = TEXTOS_COTIZACIONES.conversion;

/**
 * La cotización no se puede convertir desde este formulario: ya no está aprobada
 * (COTIZACION_NO_CONVERTIBLE), no existe o es del otro tipo.
 */
export function ConversionNoDisponible({
  cotizacionId,
  error,
  tipo,
}: {
  cotizacionId: number;
  error: unknown;
  tipo: string | undefined;
}) {
  const mensaje = error
    ? mensajeDeError(error)
    : tipo
      ? C.otroTipo(TEXTOS_COTIZACIONES.tipos[tipo] ?? tipo)
      : C.noAprobada;
  return (
    <div className="flex flex-col items-start gap-3">
      <Alerta tono="peligro" rol="alert">
        {mensaje}
      </Alerta>
      <EnlaceBoton a={`/cotizaciones/${String(cotizacionId)}`}>{C.verCotizacion}</EnlaceBoton>
    </div>
  );
}
