/** Guarda en el equipo un archivo recibido de la API (por ejemplo, la plantilla de Excel). */
export function guardarArchivo(contenido: Blob, nombre: string): void {
  const url = URL.createObjectURL(contenido);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  // Se libera después de que el navegador inicia la descarga.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/** Nombre del archivo en la cabecera Content-Disposition, o el nombre por defecto. */
export function nombreDeArchivo(cabecera: string | null, porDefecto: string): string {
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cabecera ?? "");
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);
  const simple = /filename="?([^";]+)"?/i.exec(cabecera ?? "");
  return simple?.[1] ?? porDefecto;
}
