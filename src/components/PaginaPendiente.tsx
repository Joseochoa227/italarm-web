import { Hammer } from "lucide-react";

import { EstadoVacio } from "@/components/ui/EstadoVacio";

/** Aviso de que una sección llega en una fase posterior. */
export function AvisoFase({ fase }: { fase: number }) {
  return (
    <EstadoVacio
      icono={<Hammer aria-hidden size={28} />}
      titulo={`Esta sección llega en la Fase ${String(fase)}`}
    >
      Estamos construyendo ITALARM por partes. Esta pantalla estará disponible cuando se entregue esa fase.
    </EstadoVacio>
  );
}

/** Pantalla de un módulo que llega en una fase posterior (entregable de la Fase 0: "menú vacío"). */
export function PaginaPendiente({ titulo, fase }: { titulo: string; fase: number }) {
  return (
    <>
      <h1 className="m-0 text-[32px] escritorio:text-[40px]">{titulo}</h1>
      <AvisoFase fase={fase} />
    </>
  );
}
