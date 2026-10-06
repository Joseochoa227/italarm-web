import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cx } from "@/lib/clases";

interface PropiedadesDialogo {
  abierto: boolean;
  alCambiar: (abierto: boolean) => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  /** "centro": diálogo del prototipo; "inferior": hoja que sube desde abajo en el celular. */
  posicion?: "centro" | "inferior";
}

/** Diálogo accesible (foco atrapado, Escape para cerrar) sobre Radix. */
export function Dialogo({
  abierto,
  alCambiar,
  titulo,
  descripcion,
  children,
  posicion = "centro",
}: PropiedadesDialogo) {
  return (
    <RadixDialog.Root open={abierto} onOpenChange={alCambiar}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-20 bg-neutro-900/45" />
        <RadixDialog.Content
          {...(descripcion ? {} : { "aria-describedby": undefined })}
          className={cx(
            "fixed z-30 flex flex-col gap-4 bg-fondo shadow-lg",
            posicion === "centro"
              ? "top-1/2 left-1/2 w-[min(460px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-lg p-6"
              : "inset-x-0 bottom-0 rounded-t-lg px-4 pt-6 pb-[calc(20px+env(safe-area-inset-bottom))]",
          )}
        >
          <div className="flex items-center gap-2">
            <RadixDialog.Title
              className={cx(
                "m-0 flex-1",
                posicion === "centro"
                  ? "font-titulo text-xl font-semibold"
                  : "font-texto rotulo font-normal text-neutro-700",
              )}
            >
              {titulo}
            </RadixDialog.Title>
            {posicion === "centro" && (
              <RadixDialog.Close
                aria-label="Cerrar"
                className="grid size-[44px] cursor-pointer place-items-center rounded-md text-acento-700 hover:bg-acento/10"
              >
                <X aria-hidden size={18} />
              </RadixDialog.Close>
            )}
          </div>
          {descripcion && (
            <RadixDialog.Description className="m-0 text-sm text-neutro-700">
              {descripcion}
            </RadixDialog.Description>
          )}
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
