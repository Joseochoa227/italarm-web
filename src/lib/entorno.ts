import { z } from "zod/mini";

/** Variables de entorno de la app (BF-15). Solo variables VITE_, nunca secretos. zod/mini: carga al arrancar. */
const esquemaEntorno = z.object({
  VITE_API_URL: z.url({ error: "VITE_API_URL debe ser una URL, por ejemplo http://localhost:8080" }),
});

export type Entorno = z.infer<typeof esquemaEntorno>;

export type ResultadoEntorno = { entorno: Entorno; error: null } | { entorno: null; error: string };

/** Valida las variables sin lanzar: si falta algo, la app muestra el error en pantalla (main.tsx). */
export function revisarEntorno(variables: Record<string, unknown>): ResultadoEntorno {
  const resultado = esquemaEntorno.safeParse(variables);
  if (!resultado.success) {
    const detalle = resultado.error.issues.map((i) => i.message).join("; ");
    return {
      entorno: null,
      error: `Configuración incompleta: ${detalle}. Revisa el archivo .env.local (ver .env.example).`,
    };
  }
  return { entorno: { VITE_API_URL: resultado.data.VITE_API_URL.replace(/\/+$/, "") }, error: null };
}

/** Configuración con la que arrancó la app. */
export const configuracion = revisarEntorno(import.meta.env);
