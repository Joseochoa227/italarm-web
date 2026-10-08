/**
 * Decimales escritos por el usuario (W-04): coma o punto como separador decimal (uno solo) y sin
 * separador de miles. Se convierten al texto decimal de la API ("3912.45") sin pasar por number
 * (RT-06), para no perder precisión.
 */

export type ResultadoDecimal = { valor: string; error: null } | { valor: null; error: string };

export interface OpcionesDecimal {
  /** Máximo de decimales; 0 para enteros. */
  maxDecimales: number;
  permitirNegativo?: boolean;
}

export const MENSAJES_DECIMAL = {
  invalido: "Escribe solo números, con coma o punto para los decimales y sin separador de miles.",
  entero: "Este valor no admite decimales.",
  decimales: (n: number) => `Admite máximo ${n} ${n === 1 ? "decimal" : "decimales"}.`,
  negativo: "No puede ser negativo.",
} as const;

const PATRON = /^(-?)(\d+)(?:[.,](\d+))?$/;

/** "3912,45" → "3912.45". Devuelve el error para mostrar junto al campo si no es válido. */
export function leerDecimal(
  texto: string,
  { maxDecimales, permitirNegativo = false }: OpcionesDecimal,
): ResultadoDecimal {
  const limpio = texto.trim();
  const partes = PATRON.exec(limpio);
  if (!partes) return { valor: null, error: MENSAJES_DECIMAL.invalido };
  const [, signo = "", entero = "", decimales = ""] = partes;
  if (signo && !permitirNegativo) return { valor: null, error: MENSAJES_DECIMAL.negativo };
  if (decimales.length > maxDecimales) {
    return {
      valor: null,
      error: maxDecimales === 0 ? MENSAJES_DECIMAL.entero : MENSAJES_DECIMAL.decimales(maxDecimales),
    };
  }
  const sinCeros = entero.replace(/^0+(?=\d)/, "");
  const valor = `${signo}${sinCeros}${decimales ? `.${decimales}` : ""}`;
  return { valor: valor === "-0" ? "0" : valor, error: null };
}

/** Texto decimal de la API → texto para editar: "19.5000" → "19,5"; "25.0000" → "25". */
export function decimalAEdicion(valor: string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "";
  const [entero = "", decimales = ""] = valor.split(".");
  const recortados = decimales.replace(/0+$/, "");
  return recortados ? `${entero},${recortados}` : entero;
}

/**
 * Aritmética de textos decimales con enteros grandes (BigInt), sin pasar por number. Solo para
 * vistas previas del frontend (por ejemplo, el nuevo stock de un ajuste); los valores oficiales los
 * calcula el backend (BF-06).
 */
function aEscala(valor: string, escala: number): bigint {
  const negativo = valor.startsWith("-");
  const [entero = "0", decimales = ""] = (negativo ? valor.slice(1) : valor).split(".");
  const n = BigInt(entero + decimales.padEnd(escala, "0").slice(0, escala));
  return negativo ? -n : n;
}

function deEscala(n: bigint, escala: number): string {
  const negativo = n < 0n;
  const texto = (negativo ? -n : n).toString().padStart(escala + 1, "0");
  const entero = texto.slice(0, texto.length - escala);
  const decimales = texto.slice(texto.length - escala).replace(/0+$/, "");
  const resultado = decimales ? `${entero}.${decimales}` : entero;
  return negativo && resultado !== "0" ? `-${resultado}` : resultado;
}

function escalaDe(...valores: string[]): number {
  return Math.max(0, ...valores.map((v) => v.split(".")[1]?.length ?? 0));
}

export function sumarDecimales(a: string, b: string): string {
  const escala = escalaDe(a, b);
  return deEscala(aEscala(a, escala) + aEscala(b, escala), escala);
}

export function restarDecimales(a: string, b: string): string {
  const escala = escalaDe(a, b);
  return deEscala(aEscala(a, escala) - aEscala(b, escala), escala);
}

/** -1 si a < b, 0 si son iguales, 1 si a > b. */
export function compararDecimales(a: string, b: string): -1 | 0 | 1 {
  const escala = escalaDe(a, b);
  const diferencia = aEscala(a, escala) - aEscala(b, escala);
  return diferencia < 0n ? -1 : diferencia > 0n ? 1 : 0;
}
