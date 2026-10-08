import { Search } from "lucide-react";
import { lazy, Suspense, useState } from "react";

import { cx } from "@/lib/clases";

import { TEXTOS_NAVEGACION } from "./navegacion";

// El diálogo (y el escáner) se cargan al abrirlo: no pesan en la primera carga (BF-12).
const DialogoBuscarSerial = lazy(() => import("@/features/inventario/components/DialogoBuscarSerial"));

/** Lupa para buscar un serial desde cualquier pantalla (RF-24, W-06). */
export function BotonBuscarSerial({ conTexto = false }: { conTexto?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={conTexto ? undefined : TEXTOS_NAVEGACION.buscarSerial}
        onClick={() => {
          setAbierto(true);
        }}
        className={cx(
          "flex cursor-pointer items-center gap-2.5 rounded-md text-sm",
          conTexto
            ? "min-h-[40px] border border-divisor px-2.5 text-tinta hover:bg-tenue"
            : "size-[44px] justify-center text-acento-700 hover:bg-acento/10",
        )}
      >
        <Search aria-hidden size={18} />
        {conTexto && <span>{TEXTOS_NAVEGACION.buscarSerial}</span>}
      </button>
      {abierto && (
        <Suspense>
          <DialogoBuscarSerial
            alCerrar={() => {
              setAbierto(false);
            }}
          />
        </Suspense>
      )}
    </>
  );
}
