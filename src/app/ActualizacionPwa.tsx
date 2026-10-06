import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

import { useAvisar } from "@/components/ui/contextoAvisos";

import { TEXTOS_NAVEGACION } from "./navegacion";

/** Cuando se publica una versión nueva, ofrece actualizar sin interrumpir lo que se está haciendo. */
export function ActualizacionPwa() {
  const avisar = useAvisar();
  const {
    needRefresh: [hayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!hayVersionNueva) return;
    avisar({
      titulo: TEXTOS_NAVEGACION.nuevaVersion,
      tono: "info",
      duracion: Infinity,
      accion: { etiqueta: TEXTOS_NAVEGACION.actualizar, alElegir: () => void updateServiceWorker(true) },
    });
  }, [hayVersionNueva, avisar, updateServiceWorker]);

  return null;
}
