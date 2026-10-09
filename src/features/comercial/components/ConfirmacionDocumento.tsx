import { CircleCheck, Eye, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { Boton } from "@/components/ui/Boton";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { Tarjeta } from "@/components/ui/Tarjeta";

/**
 * Confirmación de un documento registrado (RF-104, RF-120): título, cliente, total, lo que cada
 * documento agregue (`children`), las acciones del comprobante, ver el documento y registrar otro.
 */
export function ConfirmacionDocumento({
  titulo,
  texto,
  total,
  acciones,
  ver,
  otra,
  children,
}: {
  titulo: string;
  texto: string;
  total: string | undefined;
  acciones: ReactNode;
  ver: { a: string; etiqueta: string };
  otra: { etiqueta: string; alElegir: () => void };
  children?: ReactNode;
}) {
  return (
    <Tarjeta className="mx-auto w-full max-w-[520px] items-stretch gap-3 text-center">
      <CircleCheck aria-hidden size={40} className="self-center text-acento-700" />
      <h2 className="m-0 text-[26px]">{titulo}</h2>
      <p className="m-0 text-sm text-neutro-700">{texto}</p>
      {total && <p className="m-0 font-titulo text-[28px] font-semibold">{total}</p>}
      {children}
      {acciones}
      <EnlaceBoton a={ver.a} icono={<Eye aria-hidden size={16} />}>
        {ver.etiqueta}
      </EnlaceBoton>
      <Boton variante="fantasma" bloque onClick={otra.alElegir}>
        <RotateCcw aria-hidden size={16} />
        {otra.etiqueta}
      </Boton>
    </Tarjeta>
  );
}
