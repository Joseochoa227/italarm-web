import type { components } from "@/api/esquema";
import { Alerta } from "@/components/ui/Alerta";
import { AccionesComprobante } from "@/features/comercial/components/AccionesComprobante";
import { ConfirmacionDocumento } from "@/features/comercial/components/ConfirmacionDocumento";
import { formatearDineroDe, formatearFecha } from "@/lib/formato";

import { comprobanteInstalacion, enlaceInstalacion } from "../comprobante";
import { TEXTOS_INSTALACIONES } from "../textos";

const C = TEXTOS_INSTALACIONES.confirmacion;
const F = TEXTOS_INSTALACIONES.fotos;

export interface ProgresoFotos {
  total: number;
  subidas: number;
  fallidas: number;
}

/**
 * Confirmación de la instalación (RF-120): cliente, total, vencimiento de la garantía, avance de la
 * subida de fotos, comprobante, ver la instalación u otra.
 */
export function ConfirmacionInstalacion({
  instalacion,
  fotos,
  alRegistrarOtra,
}: {
  instalacion: components["schemas"]["InstalacionVista"];
  fotos: ProgresoFotos;
  alRegistrarOtra: () => void;
}) {
  const id = instalacion.id ?? 0;
  const consecutivo = instalacion.consecutivo ?? "";
  const vence = instalacion.garantias?.venceManoObra;
  const terminadas = fotos.subidas + fotos.fallidas;
  return (
    <ConfirmacionDocumento
      titulo={C.titulo(consecutivo)}
      texto={C.texto(instalacion.cliente?.nombre ?? "")}
      total={instalacion.total ? formatearDineroDe(instalacion.total) : undefined}
      acciones={
        <AccionesComprobante
          bloque
          consecutivo={consecutivo}
          obtenerPdf={() => comprobanteInstalacion(id, consecutivo)}
          obtenerEnlace={() => enlaceInstalacion(id)}
        />
      }
      ver={{ a: `/instalaciones/${String(id)}`, etiqueta: C.ver }}
      otra={{ etiqueta: C.otra, alElegir: alRegistrarOtra }}
    >
      {vence && <p className="m-0 text-sm font-medium">{C.garantia(formatearFecha(vence))}</p>}
      {fotos.total > 0 && (
        <div role="status" className="flex flex-col gap-2 text-left">
          {terminadas < fotos.total ? (
            <p className="m-0 text-sm text-neutro-700">{F.subiendo(terminadas, fotos.total)}</p>
          ) : (
            fotos.subidas > 0 && <p className="m-0 text-sm text-neutro-700">{F.subidas(fotos.subidas)}</p>
          )}
          {fotos.fallidas > 0 && terminadas === fotos.total && (
            <Alerta tono="aviso">{F.fallidas(fotos.fallidas)}</Alerta>
          )}
        </div>
      )}
    </ConfirmacionDocumento>
  );
}
