import { CircleCheck, CircleX, FilePen, Hourglass, Repeat, Send } from "lucide-react";

import { Etiqueta } from "@/components/ui/Etiqueta";

import { TEXTOS_COTIZACIONES } from "../textos";

const ESTILOS = {
  BORRADOR: { tono: "neutro", Icono: FilePen },
  EN_EVALUACION: { tono: "contorno", Icono: Send },
  APROBADA: { tono: "acento", Icono: CircleCheck },
  CONVERTIDA: { tono: "acento", Icono: Repeat },
  RECHAZADA: { tono: "peligro", Icono: CircleX },
  VENCIDA: { tono: "neutro", Icono: Hourglass },
} as const;

/** Estado de la cotización con color, ícono y texto (W-02: el rojo nunca va solo). */
export function EstadoCotizacion({ estado }: { estado: string | undefined }) {
  if (!estado) return null;
  const estilo = estado in ESTILOS ? ESTILOS[estado as keyof typeof ESTILOS] : ESTILOS.BORRADOR;
  return (
    <Etiqueta tono={estilo.tono}>
      <estilo.Icono aria-hidden size={12} className="mr-1" />
      {TEXTOS_COTIZACIONES.estados[estado] ?? estado}
    </Etiqueta>
  );
}
