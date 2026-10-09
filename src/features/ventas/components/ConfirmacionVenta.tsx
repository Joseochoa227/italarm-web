import type { components } from "@/api/esquema";
import { AccionesComprobante } from "@/features/comercial/components/AccionesComprobante";
import { ConfirmacionDocumento } from "@/features/comercial/components/ConfirmacionDocumento";
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
    <ConfirmacionDocumento
      titulo={C.titulo(consecutivo)}
      texto={C.texto(venta.cliente?.nombre ?? "")}
      total={venta.total ? formatearDineroDe(venta.total) : undefined}
      acciones={
        <AccionesComprobante
          bloque
          consecutivo={consecutivo}
          obtenerPdf={() => comprobanteVenta(id, consecutivo)}
          obtenerEnlace={() => enlaceVenta(id)}
        />
      }
      ver={{ a: `/ventas/${String(id)}`, etiqueta: C.ver }}
      otra={{ etiqueta: C.otra, alElegir: alRegistrarOtra }}
    />
  );
}
