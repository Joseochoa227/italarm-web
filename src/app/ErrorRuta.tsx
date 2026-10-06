import { CircleAlert } from "lucide-react";
import { useRouteError } from "react-router";

import { Boton } from "@/components/ui/Boton";
import { MENSAJES_ERROR } from "@/lib/errores";

/**
 * Error inesperado al cargar o dibujar una pantalla (BF-09). El caso más común después de publicar
 * una versión nueva es que el archivo de la pantalla ya no exista: recargar lo resuelve.
 */
export function ErrorRuta() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-[460px] place-items-center p-6">
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-lg bg-peligro-100 p-6 text-peligro-900"
      >
        <div className="flex items-start gap-2">
          <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0 text-peligro-700" />
          <p className="m-0 text-sm">{MENSAJES_ERROR.generico}</p>
        </div>
        <Boton
          onClick={() => {
            window.location.reload();
          }}
        >
          Reintentar
        </Boton>
      </div>
    </main>
  );
}
