import { api } from "@/api/cliente";
import type { PdfComprobante } from "@/features/comercial/components/AccionesComprobante";
import { nombreDeArchivo } from "@/lib/descargas";

/** PDF del comprobante de instalación con la sesión (RF-132, RF-133), con el nombre que da el backend. */
export async function comprobanteInstalacion(id: number, consecutivo: string): Promise<PdfComprobante> {
  const { data, response } = await api.GET("/api/v1/instalaciones/{id}/comprobante", {
    params: { path: { id } },
    parseAs: "blob",
  });
  return {
    blob: data ?? new Blob([], { type: "application/pdf" }),
    nombre: nombreDeArchivo(
      response.headers.get("Content-Disposition"),
      `${consecutivo || "instalacion"}.pdf`,
    ),
  };
}

/** Enlace público del comprobante para WhatsApp (P-33, 30 días). */
export async function enlaceInstalacion(id: number) {
  return (await api.POST("/api/v1/instalaciones/{id}/enlace", { params: { path: { id } } })).data;
}
