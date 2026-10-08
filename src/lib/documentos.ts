import type { components } from "@/api/esquema";

type DocumentoRef = components["schemas"]["DocumentoRef"];

/**
 * Ruta del detalle de un documento referenciado (`documento: { tipo, id, consecutivo }`, guía §9).
 * Instalaciones y cotizaciones no tienen pantalla hasta sus fases: devuelven null.
 */
export function rutaDocumento(documento: DocumentoRef | undefined): string | null {
  if (documento?.id === undefined) return null;
  switch (documento.tipo) {
    case "COMPRA":
      return `/compras/${String(documento.id)}`;
    case "AJUSTE":
      return `/inventario/ajustes/${String(documento.id)}`;
    case "VENTA":
      return `/ventas/${String(documento.id)}`;
    case "INVENTARIO_INICIAL":
      return "/configuracion?pestana=carga";
    default:
      return null;
  }
}
