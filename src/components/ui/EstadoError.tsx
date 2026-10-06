import { CircleAlert } from "lucide-react";

import { comoErrorApi } from "@/api/problema";
import { esReintentable, mensajeDeError } from "@/lib/errores";

import { Boton } from "./Boton";

/** Error con opción de reintentar y el código de soporte (BF-09, guía §2). */
export function EstadoError({ error, alReintentar }: { error: unknown; alReintentar?: () => void }) {
  const e = comoErrorApi(error);
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-peligro-200 bg-peligro-100 p-6 text-peligro-900"
    >
      <div className="flex items-start gap-2">
        <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0 text-peligro-700" />
        <p className="m-0 text-sm">{mensajeDeError(e)}</p>
      </div>
      {e.correlationId && (
        <p className="m-0 text-xs text-peligro-800">Código de soporte: {e.correlationId}</p>
      )}
      {alReintentar && esReintentable(e) && (
        <Boton variante="secundario" onClick={alReintentar}>
          Reintentar
        </Boton>
      )}
    </div>
  );
}
