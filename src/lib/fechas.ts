/** Fechas de negocio en la zona de Colombia, como texto "aaaa-mm-dd" (sin Date para no correr el día). */

const formatoIso = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Fecha de hoy en Bogotá: "2026-10-06". */
export function hoyBogota(ahora: Date = new Date()): string {
  return formatoIso.format(ahora);
}

/** Suma o resta días a una fecha "aaaa-mm-dd". */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const utc = new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1));
  utc.setUTCDate(utc.getUTCDate() + dias);
  return utc.toISOString().slice(0, 10);
}
