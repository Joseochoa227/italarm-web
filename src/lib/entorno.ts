import { z } from "zod/mini";

/** Variables de entorno de la app (BF-15). Solo variables VITE_, nunca secretos. zod/mini: carga al arrancar. */
const esquemaEntorno = z.object({
  VITE_API_URL: z.url({ error: "VITE_API_URL debe ser una URL, por ejemplo http://localhost:8080" }),
});

export type Entorno = z.infer<typeof esquemaEntorno>;

export function leerEntorno(variables: Record<string, unknown>): Entorno {
  const resultado = esquemaEntorno.safeParse(variables);
  if (!resultado.success) {
    const detalle = resultado.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Configuración incompleta: ${detalle}. Revisa el archivo .env.local (ver .env.example).`);
  }
  return { VITE_API_URL: resultado.data.VITE_API_URL.replace(/\/+$/, "") };
}
