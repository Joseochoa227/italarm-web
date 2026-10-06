/** Ruta a la que se vuelve después de ingresar: solo rutas internas, para no redirigir fuera de la app. */
export function rutaVolver(valor: string | null): string {
  if (!valor?.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) return "/";
  if (valor.startsWith("/ingresar")) return "/";
  return valor;
}

export function rutaIngreso(rutaActual: string): string {
  return rutaActual === "/" ? "/ingresar" : `/ingresar?volver=${encodeURIComponent(rutaActual)}`;
}
