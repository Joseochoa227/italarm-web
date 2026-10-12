import { api } from "@/api/cliente";
import type { PdfComprobante } from "@/features/comercial/components/AccionesComprobante";
import { nombreDeArchivo } from "@/lib/descargas";

import { TEXTOS_COTIZACIONES } from "./textos";

/** PDF de la cotización con la sesión. No cambia el estado (guía §17). */
export async function comprobanteCotizacion(id: number, consecutivo: string): Promise<PdfComprobante> {
  const { data, response } = await api.GET("/api/v1/cotizaciones/{id}/comprobante", {
    params: { path: { id } },
    parseAs: "blob",
  });
  return {
    blob: data ?? new Blob([], { type: "application/pdf" }),
    nombre: nombreDeArchivo(
      response.headers.get("Content-Disposition"),
      `${consecutivo || TEXTOS_COTIZACIONES.titulo}.pdf`,
    ),
  };
}

/** Enlace público para WhatsApp; pasa la cotización a En evaluación. */
export async function enlaceCotizacion(id: number) {
  return (await api.POST("/api/v1/cotizaciones/{id}/enlace", { params: { path: { id } } })).data;
}

/** Marca la cotización como enviada (P-50): al compartir el PDF en el celular o al descargarlo. */
export async function marcarEnviada(id: number) {
  return (await api.POST("/api/v1/cotizaciones/{id}/enviar", { params: { path: { id } } })).data;
}
