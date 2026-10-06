import * as Toast from "@radix-ui/react-toast";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";

import { cx } from "@/lib/clases";

import { type Aviso, ContextoAvisos } from "./contextoAvisos";

interface AvisoEnPantalla extends Aviso {
  id: number;
}

const ICONOS = {
  exito: <CircleCheck aria-hidden size={18} className="shrink-0 text-acento-700" />,
  error: <CircleAlert aria-hidden size={18} className="shrink-0 text-peligro-700" />,
  info: <Info aria-hidden size={18} className="shrink-0 text-acento-700" />,
};

let siguienteId = 1;

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<AvisoEnPantalla[]>([]);

  const avisar = useCallback((aviso: Aviso) => {
    const id = siguienteId++;
    setAvisos((actuales) => [...actuales, { ...aviso, id }]);
  }, []);

  const quitar = (id: number) => {
    setAvisos((actuales) => actuales.filter((a) => a.id !== id));
  };

  return (
    <ContextoAvisos.Provider value={avisar}>
      <Toast.Provider swipeDirection="down" label="Notificación">
        {children}
        {avisos.map((aviso) => (
          <Toast.Root
            key={aviso.id}
            duration={aviso.duracion ?? 5000}
            type={aviso.tono === "error" ? "foreground" : "background"}
            onOpenChange={(abierto) => {
              if (!abierto) quitar(aviso.id);
            }}
            className={cx(
              "flex items-start gap-3 rounded-lg border bg-tarjeta p-4 shadow-md",
              aviso.tono === "error" ? "border-peligro-300" : "border-borde",
            )}
          >
            {ICONOS[aviso.tono ?? "exito"]}
            <div className="flex flex-1 flex-col gap-0.5">
              <Toast.Title className="text-sm font-medium">{aviso.titulo}</Toast.Title>
              {aviso.descripcion && (
                <Toast.Description className="text-xs text-neutro-700">{aviso.descripcion}</Toast.Description>
              )}
            </div>
            {aviso.accion && (
              <Toast.Action
                altText={aviso.accion.etiqueta}
                onClick={aviso.accion.alElegir}
                className="min-h-[36px] cursor-pointer rounded-md px-2 font-titulo font-semibold text-acento-700 hover:bg-acento/10"
              >
                {aviso.accion.etiqueta}
              </Toast.Action>
            )}
            <Toast.Close aria-label="Cerrar notificación" className="cursor-pointer p-1 text-neutro-700">
              <X aria-hidden size={16} />
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed right-0 bottom-[76px] z-50 flex w-full max-w-[420px] flex-col gap-2 p-4 outline-none escritorio:bottom-0" />
      </Toast.Provider>
    </ContextoAvisos.Provider>
  );
}
