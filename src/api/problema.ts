import { z } from "zod/mini";

/**
 * Errores de la API en Problem Details (RFC 9457, guía §2).
 * El contrato todavía no declara `codigo`, `errores` ni `correlationId` en ProblemDetail
 * (dependencia D-01 del plan), así que se validan aquí al recibirlos. Se usa zod/mini porque este
 * archivo carga con la app y debe pesar poco (BF-12).
 */
const esquemaProblema = z.object({
  detail: z.nullish(z.string()),
  codigo: z.nullish(z.string()),
  correlationId: z.nullish(z.string()),
  errores: z.nullish(
    z.array(
      z.object({
        campo: z.nullish(z.string()),
        mensaje: z.string(),
        hoja: z.nullish(z.string()),
        fila: z.nullish(z.number()),
      }),
    ),
  ),
});

export interface ErrorDeCampo {
  campo: string | null;
  mensaje: string;
  hoja: string | null;
  fila: number | null;
}

/** Códigos que no vienen del backend: los pone el frontend cuando la petición ni siquiera llega. */
export const SIN_CONEXION = "SIN_CONEXION";
export const RESPUESTA_INVALIDA = "RESPUESTA_INVALIDA";

export class ErrorApi extends Error {
  override readonly name = "ErrorApi";

  constructor(
    /** Estado HTTP; 0 si no hubo respuesta. */
    readonly status: number,
    /** Código de negocio estable: el comportamiento se decide por él, nunca por el texto. */
    readonly codigo: string,
    /** Mensaje en español listo para mostrar, si el backend lo envió. */
    readonly detalle: string | null,
    readonly errores: ErrorDeCampo[] = [],
    readonly correlationId: string | null = null,
  ) {
    super(detalle ?? codigo);
  }

  /** Mensaje del campo indicado, si el backend lo rechazó (VALIDACION). */
  errorDeCampo(campo: string): string | undefined {
    return this.errores.find((e) => e.campo === campo)?.mensaje;
  }
}

/** Convierte una respuesta de error de la API en ErrorApi. Nunca falla. */
export async function leerProblema(respuesta: Response): Promise<ErrorApi> {
  const correlacionCabecera = respuesta.headers.get("X-Correlation-Id");
  let cuerpo: unknown = null;
  try {
    cuerpo = await respuesta.clone().json();
  } catch {
    // Sin cuerpo JSON (por ejemplo, un proxy que respondió HTML).
  }
  const problema = esquemaProblema.safeParse(cuerpo);
  if (!problema.success || !problema.data.codigo) {
    return new ErrorApi(respuesta.status, RESPUESTA_INVALIDA, null, [], correlacionCabecera);
  }
  const p = problema.data;
  return new ErrorApi(
    respuesta.status,
    p.codigo ?? RESPUESTA_INVALIDA,
    p.detail ?? null,
    (p.errores ?? []).map((e) => ({
      // "lineas[0].cantidad" (Spring) → "lineas.0.cantidad" (React Hook Form).
      campo: e.campo?.replace(/\[(\d+)\]/g, ".$1") ?? null,
      mensaje: e.mensaje,
      hoja: e.hoja ?? null,
      fila: e.fila ?? null,
    })),
    p.correlationId ?? correlacionCabecera,
  );
}

/** Normaliza cualquier error capturado (de una consulta, mutación o render) a ErrorApi. */
export function comoErrorApi(error: unknown): ErrorApi {
  if (error instanceof ErrorApi) return error;
  return new ErrorApi(0, SIN_CONEXION, null);
}

/**
 * Primer error de un grupo de consultas. openapi-react-query tipa `error` según las respuestas de
 * error que declara el contrato (a veces ninguna, y queda `never`); en realidad siempre es un ErrorApi
 * lanzado por el middleware del cliente. Por eso se trata como unknown.
 */
export function errorDeConsultas(...consultas: { isError: boolean; error: unknown }[]): unknown {
  return consultas.find((c) => c.isError)?.error ?? null;
}
