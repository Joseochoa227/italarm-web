import { CircleCheck, Eye, RotateCcw } from "lucide-react";

import type { components } from "@/api/esquema";
import { Boton } from "@/components/ui/Boton";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { AccionesComprobante } from "@/features/comercial/components/AccionesComprobante";
import { formatearDineroDe } from "@/lib/formato";

import { comprobanteVenta, enlaceVenta } from "../comprobante";
import { TEXTOS_VENTAS } from "../textos";

const C = TEXTOS_VENTAS.confirmacion;

/** Confirmación de la venta (RF-104): comprobante por WhatsApp, PDF, ver la venta u otra venta. */
export function ConfirmacionVenta({
  venta,
  alRegistrarOtra,
}: {
  venta: components["schemas"]["VentaVista"];
  alRegistrarOtra: () => void;
}) {
  const id = venta.id ?? 0;
  const consecutivo = venta.consecutivo ?? "";
  return (
    <Tarjeta className="mx-auto w-full max-w-[520px] items-stretch gap-3 text-center">
      <CircleCheck aria-hidden size={40} className="self-center text-acento-700" />
      <h2 className="m-0 text-[26px]">{C.titulo(consecutivo)}</h2>
      <p className="m-0 text-sm text-neutro-700">{C.texto(venta.cliente?.nombre ?? "")}</p>
      {venta.total && (
        <p className="m-0 font-titulo text-[28px] font-semibold">{formatearDineroDe(venta.total)}</p>
      )}
      <AccionesComprobante
        bloque
        consecutivo={consecutivo}
        obtenerPdf={() => comprobanteVenta(id, consecutivo)}
        obtenerEnlace={() => enlaceVenta(id)}
      />
      <EnlaceBoton a={`/ventas/${String(id)}`} icono={<Eye aria-hidden size={16} />}>
        {C.ver}
      </EnlaceBoton>
      <Boton variante="fantasma" bloque onClick={alRegistrarOtra}>
        <RotateCcw aria-hidden size={16} />
        {C.otra}
      </Boton>
    </Tarjeta>
  );
}
