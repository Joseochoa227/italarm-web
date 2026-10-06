/**
 * Token de sesión en localStorage (P-05). Cualquier acceso puede fallar (navegación privada,
 * almacenamiento bloqueado), así que se protege y la app sigue funcionando sin él.
 */
const CLAVE = "italarm.token";

export function leerToken(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

export function guardarToken(token: string): void {
  try {
    localStorage.setItem(CLAVE, token);
  } catch {
    // Sin almacenamiento la sesión dura lo que dure la pestaña.
  }
}

export function borrarToken(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Nada que borrar.
  }
}
