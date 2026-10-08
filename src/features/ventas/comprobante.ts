import { api } from "@/api/cliente";
import type { PdfComprobante } from "@/features/comercial/components/AccionesComprobante";
import { nombreDeArchivo } from "@/lib/descargas";

import { TEXTOS_VENTAS } from "./textos";

/** PDF del comprobante de venta con la sesión (RF-133), con el nombre que da el backend. */
export async function comprobanteVenta(id: number, consecutivo: string): Promise<PdfComprobante> {
  const { data, response } = await api.GET("/api/v1/ventas/{id}/comprobante", {
    params: { path: { id } },
    parseAs: "blob",
  });
  return {
    blob: data ?? new Blob([], { type: "application/pdf" }),
    nombre: nombreDeArchivo(
      response.headers.get("Content-Disposition"),
      `${consecutivo || TEXTOS_VENTAS.titulo}.pdf`,
    ),
  };
}

/** Enlace público del comprobante para WhatsApp (P-33, 30 días). */
export async function enlaceVenta(id: number) {
  return (await api.POST("/api/v1/ventas/{id}/enlace", { params: { path: { id } } })).data;
}
