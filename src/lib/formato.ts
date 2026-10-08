/**
 * Formato de dinero, cantidades y fechas (BF-07, guía §3). Es el único lugar donde se formatea:
 * los componentes nunca arman estos textos a mano.
 *
 * Los valores llegan del backend como texto decimal ("1939.0400") y se le pasan tal cual a
 * Intl.NumberFormat, que formatea el texto sin convertirlo a número de punto flotante.
 */
import type { components } from "@/api/esquema";

type Dinero = components["schemas"]["Dinero"];
export type Moneda = NonNullable<Dinero["moneda"]>;

const LOCALE = "es-CO";
const ZONA = "America/Bogota";
const ESPACIO = " "; // espacio que no se parte entre el símbolo y el valor

const formatosMoneda: Record<Moneda, Intl.NumberFormat> = {
  COP: new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }),
  USD: new Intl.NumberFormat(LOCALE, { style: "currency", currency: "USD" }),
  // Intl no tiene el símbolo "Bs": se formatea el número y se antepone a mano.
  VES: new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
};

/** Texto decimal del backend: dígitos con signo y punto decimal opcionales. */
const DECIMAL = /^-?\d+(\.\d+)?$/;

function validarDecimal(valor: string): `${number}` {
  if (!DECIMAL.test(valor)) throw new Error(`Valor decimal inválido: "${valor}"`);
  return valor as `${number}`;
}

/** $ 1.250.000 · US$ 1.939,04 · Bs 1.234,56 */
export function formatearDinero(monto: string, moneda: Moneda): string {
  const valor = validarDecimal(monto);
  if (moneda === "VES") {
    const negativo = valor.startsWith("-");
    const numero = formatosMoneda.VES.format(negativo ? (valor.slice(1) as `${number}`) : valor);
    return `${negativo ? "-" : ""}Bs${ESPACIO}${numero}`;
  }
  return formatosMoneda[moneda].format(valor);
}

/** Formatea un objeto Dinero del contrato ({ monto, moneda }). */
export function formatearDineroDe(dinero: Dinero): string {
  if (dinero.monto === undefined || dinero.moneda === undefined) return "—";
  return formatearDinero(dinero.monto, dinero.moneda);
}

type MontoEnMonedas = components["schemas"]["MontoEnMonedas"];

/**
 * Un valor en USD, COP y VES (RF-31): "US$ 1.939,04 · $ 7.586.000 · Bs 96.952,00". Los
 * equivalentes que faltan (no hay tasa) se omiten; si no hay ninguno, "—".
 */
export function formatearEnMonedas(montos: MontoEnMonedas | undefined): string {
  const partes = [montos?.usd, montos?.cop, montos?.ves].flatMap((d) =>
    d?.monto !== undefined && d.moneda !== undefined ? [formatearDinero(d.monto, d.moneda)] : [],
  );
  return partes.length ? partes.join(" · ") : "—";
}

const formatoCantidad = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });

/** "12.5" → "12,5"; "1500" → "1.500". Las cantidades llegan sin ceros sobrantes. */
export function formatearCantidad(cantidad: string): string {
  return formatoCantidad.format(validarDecimal(cantidad));
}

const formatoDecimal = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 6 });

/** Número sin moneda, con hasta 6 decimales: tasas y porcentajes ("3912.450000" → "3.912,45"). */
export function formatearDecimal(valor: string): string {
  return formatoDecimal.format(validarDecimal(valor));
}

const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * "2026-10-06" → "06/10/2026". Se separa el texto sin crear un Date, para que la zona horaria
 * del navegador no corra el día.
 */
export function formatearFecha(fecha: string): string {
  const partes = FECHA.exec(fecha);
  if (!partes) throw new Error(`Fecha inválida: "${fecha}"`);
  const [, anio, mes, dia] = partes;
  return `${dia ?? ""}/${mes ?? ""}/${anio ?? ""}`;
}

const formatoFechaHora = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Instante ISO ("2026-10-06T03:30:00Z") → "05/10/2026 22:30", en hora de Colombia. */
export function formatearFechaHora(instante: string | Date): string {
  const fecha = typeof instante === "string" ? new Date(instante) : instante;
  if (Number.isNaN(fecha.getTime())) throw new Error(`Instante inválido: "${String(instante)}"`);
  const p = Object.fromEntries(formatoFechaHora.formatToParts(fecha).map((x) => [x.type, x.value]));
  return `${p.day ?? ""}/${p.month ?? ""}/${p.year ?? ""} ${p.hour ?? ""}:${p.minute ?? ""}`;
}

const formatoFechaLarga = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA,
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** "Martes 06/10/2026", como el encabezado de Inicio del prototipo. */
export function formatearFechaLarga(instante: Date): string {
  const p = Object.fromEntries(formatoFechaLarga.formatToParts(instante).map((x) => [x.type, x.value]));
  const dia = p.weekday ?? "";
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${p.day ?? ""}/${p.month ?? ""}/${p.year ?? ""}`;
}
