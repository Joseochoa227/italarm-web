import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { comoErrorApi, type ErrorApi, RESPUESTA_INVALIDA, SIN_CONEXION } from "@/api/problema";

/** Mensajes del frontend para los errores que no traen un `detail` útil (guía §2, BF-09). */
export const MENSAJES_ERROR = {
  sinConexion: "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.",
  generico: "Algo salió mal. Inténtalo de nuevo; si sigue fallando, avísanos con el código de soporte.",
} as const;

/** Errores en los que tiene sentido ofrecer "Reintentar": sin respuesta o falla del servidor. */
export function esReintentable(error: unknown): boolean {
  const e = comoErrorApi(error);
  return e.status === 0 || e.status >= 500 || e.codigo === RESPUESTA_INVALIDA;
}

/**
 * Texto para mostrar al usuario. Se decide por el código, nunca por el texto:
 * - sin conexión y errores internos: mensaje genérico (el `detail` de un 500 no ayuda al usuario);
 * - errores de negocio: el `detail` del backend, que ya viene en español.
 */
export function mensajeDeError(error: unknown): string {
  const e = comoErrorApi(error);
  if (e.codigo === SIN_CONEXION) return MENSAJES_ERROR.sinConexion;
  if (e.status >= 500 || e.codigo === "ERROR_INTERNO" || e.codigo === RESPUESTA_INVALIDA) {
    return MENSAJES_ERROR.generico;
  }
  return e.detalle ?? MENSAJES_ERROR.generico;
}

/**
 * Errores del backend que van junto a un campo del formulario (BF-05):
 * - con VALIDACION, un mensaje por campo según `errores`;
 * - con los códigos de `codigosPorCampo`, el `detail` en el campo indicado
 *   (por ejemplo CONTRASENA_ACTUAL_INCORRECTA → contrasenaActual).
 * Si la lista queda vacía, el llamador muestra el error general.
 */
export function erroresDeCampo<T extends FieldValues>(
  error: ErrorApi,
  campos: readonly Path<T>[],
  codigosPorCampo: Partial<Record<string, Path<T>>> = {},
): { campo: Path<T>; mensaje: string }[] {
  const campoDelCodigo = codigosPorCampo[error.codigo];
  if (campoDelCodigo) return [{ campo: campoDelCodigo, mensaje: error.detalle ?? MENSAJES_ERROR.generico }];
  return error.errores.flatMap(({ campo, mensaje }) => {
    const destino = campos.find((c) => c === campo);
    return destino ? [{ campo: destino, mensaje }] : [];
  });
}

/** Muestra en el formulario los errores de `erroresDeCampo`. Devuelve true si mostró alguno. */
export function aplicarErroresDeCampo<T extends FieldValues>(
  error: ErrorApi,
  setError: UseFormSetError<T>,
  campos: readonly Path<T>[],
  codigosPorCampo: Partial<Record<string, Path<T>>> = {},
): boolean {
  const lista = erroresDeCampo(error, campos, codigosPorCampo);
  for (const { campo, mensaje } of lista) setError(campo, { type: "servidor", message: mensaje });
  return lista.length > 0;
}
