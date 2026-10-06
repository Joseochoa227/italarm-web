import { WifiOff } from "lucide-react";

import { useEnLinea } from "@/lib/medios";

import { TEXTOS_NAVEGACION } from "./navegacion";

/** Aviso claro cuando no hay internet (BF-13): la app no funciona sin conexión. */
export function AvisoSinConexion() {
  const enLinea = useEnLinea();
  if (enLinea) return null;
  return (
    <div role="alert" className="flex items-center gap-2 bg-peligro-100 px-4 py-2 text-sm text-peligro-900">
      <WifiOff aria-hidden size={16} className="shrink-0 text-peligro-700" />
      {TEXTOS_NAVEGACION.sinConexion}
    </div>
  );
}
