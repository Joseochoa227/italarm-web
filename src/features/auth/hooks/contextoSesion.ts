import { createContext, useContext } from "react";

import type { components } from "@/api/esquema";

export type UsuarioActual = components["schemas"]["UsuarioActual"];
export type RespuestaIngreso = components["schemas"]["RespuestaIngreso"];

export interface Sesion {
  /** Usuario conectado, o null si no hay sesión. */
  usuario: UsuarioActual | null;
  /** true mientras se valida el token guardado al cargar la app. */
  validando: boolean;
  /** Error al validar el token (sin conexión o falla del servidor); un 401 no es error: cierra la sesión. */
  error: unknown;
  reintentar: () => void;
  /** Guarda el token recibido en POST /sesion y deja al usuario conectado. */
  iniciar: (respuesta: RespuestaIngreso) => void;
  /** DELETE /sesion y borra el token. Aunque la petición falle, el navegador queda sin sesión. */
  cerrar: () => Promise<void>;
}

export const ContextoSesion = createContext<Sesion | null>(null);

export function useSesion(): Sesion {
  const sesion = useContext(ContextoSesion);
  if (!sesion) throw new Error("useSesion debe usarse dentro de <ProveedorSesion>");
  return sesion;
}
