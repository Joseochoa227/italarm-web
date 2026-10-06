/** Inicial del nombre para el círculo del usuario, como en el prototipo. */
export function inicial(nombre: string | undefined): string {
  return (nombre?.trim().charAt(0) ?? "").toUpperCase() || "?";
}
