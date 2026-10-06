/**
 * Compresión de imágenes en el navegador antes de subirlas (BF-14, P-16): máximo 1600 px por lado,
 * en WebP. Si el navegador no genera WebP (Safari), JPEG para fotos y PNG para el logo (conserva la
 * transparencia).
 */

export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"] as const;
export const TAMANO_MAXIMO = 5 * 1024 * 1024;
const LADO_MAXIMO = 1600;
const CALIDAD = 0.85;

export class ErrorImagen extends Error {
  override readonly name = "ErrorImagen";
}

export const MENSAJES_IMAGEN = {
  tipo: "Elige una imagen JPEG, PNG o WebP.",
  tamano: "La imagen pesa más de 5 MB incluso comprimida. Elige una más liviana.",
  lectura: "No se pudo leer la imagen. Prueba con otro archivo.",
} as const;

function aBlob(lienzo: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((resolver) => {
    lienzo.toBlob(resolver, tipo, CALIDAD);
  });
}

const EXTENSIONES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

export async function comprimirImagen(archivo: File, uso: "foto" | "logo"): Promise<File> {
  if (!(TIPOS_IMAGEN as readonly string[]).includes(archivo.type))
    throw new ErrorImagen(MENSAJES_IMAGEN.tipo);

  let imagen: ImageBitmap;
  try {
    imagen = await createImageBitmap(archivo);
  } catch {
    throw new ErrorImagen(MENSAJES_IMAGEN.lectura);
  }
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  const contexto = lienzo.getContext("2d");
  if (!contexto) throw new ErrorImagen(MENSAJES_IMAGEN.lectura);
  contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();

  let blob = await aBlob(lienzo, "image/webp");
  if (blob?.type !== "image/webp") blob = await aBlob(lienzo, uso === "logo" ? "image/png" : "image/jpeg");
  if (!blob) throw new ErrorImagen(MENSAJES_IMAGEN.lectura);

  // Si comprimir no la achicó (ya era pequeña), se sube la original.
  const final = blob.size < archivo.size ? blob : archivo;
  if (final.size > TAMANO_MAXIMO) throw new ErrorImagen(MENSAJES_IMAGEN.tamano);
  if (final === archivo) return archivo;
  const base = archivo.name.replace(/\.[^.]+$/, "") || "imagen";
  return new File([final], `${base}.${EXTENSIONES[final.type] ?? "img"}`, { type: final.type });
}
