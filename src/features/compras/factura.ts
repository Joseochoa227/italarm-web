import { comprimirImagen, ErrorImagen, TAMANO_MAXIMO, TIPOS_IMAGEN } from "@/lib/imagen";

import { TEXTOS_COMPRAS } from "./textos";

const A = TEXTOS_COMPRAS.archivoFactura;
export const TIPOS_FACTURA = [...TIPOS_IMAGEN, "application/pdf"].join(",");

/** Factura adjunta (RF-44): las fotos se comprimen (BF-14); el PDF va tal cual, hasta 5 MB. */
export async function prepararFactura(archivo: File): Promise<File> {
  if (archivo.type === "application/pdf") {
    if (archivo.size > TAMANO_MAXIMO) throw new ErrorImagen(A.tamano);
    return archivo;
  }
  if (!(TIPOS_IMAGEN as readonly string[]).includes(archivo.type)) throw new ErrorImagen(A.tipo);
  return comprimirImagen(archivo, "foto");
}
