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
