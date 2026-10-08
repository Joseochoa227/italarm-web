import type { components } from "@/api/esquema";
import { Link } from "react-router";

import { rutaDocumento } from "@/lib/documentos";

/** Consecutivo de un documento con enlace a su detalle, si ya tiene pantalla (RF-56). */
export function EnlaceDocumento({
  documento,
}: {
  documento: components["schemas"]["DocumentoRef"] | undefined;
}) {
  if (!documento?.consecutivo) return <span className="text-neutro-500">—</span>;
  const ruta = rutaDocumento(documento);
  return ruta ? <Link to={ruta}>{documento.consecutivo}</Link> : <span>{documento.consecutivo}</span>;
}
