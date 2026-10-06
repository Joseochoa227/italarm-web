import type { ReactNode } from "react";

import { Boton } from "./Boton";
import { Dialogo } from "./Dialogo";

/** Confirmación de una acción importante o destructiva. */
export function Confirmacion({
  abierto,
  alCambiar,
  titulo,
  children,
  confirmar,
  alConfirmar,
  ocupado = false,
  peligro = false,
}: {
  abierto: boolean;
  alCambiar: (abierto: boolean) => void;
  titulo: string;
  children: ReactNode;
  confirmar: string;
  alConfirmar: () => void;
  ocupado?: boolean;
  peligro?: boolean;
}) {
  return (
    <Dialogo abierto={abierto} alCambiar={alCambiar} titulo={titulo}>
      <div className="text-sm">{children}</div>
      <div className="flex flex-wrap justify-end gap-2">
        <Boton
          onClick={() => {
            alCambiar(false);
          }}
        >
          Cancelar
        </Boton>
        <Boton variante={peligro ? "peligro" : "primario"} ocupado={ocupado} onClick={alConfirmar}>
          {confirmar}
        </Boton>
      </div>
    </Dialogo>
  );
}
