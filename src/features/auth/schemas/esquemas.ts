import { z } from "zod";

import { TEXTOS_AUTH } from "../textos";

const v = TEXTOS_AUTH.validacion;

export const esquemaIngreso = z.object({
  correo: z.string().trim().min(1, v.correoRequerido).pipe(z.email(v.correoInvalido)),
  contrasena: z.string().min(1, v.contrasenaRequerida),
});

export type DatosIngreso = z.infer<typeof esquemaIngreso>;

/** Política de contraseñas (P-07, P-08). El backend la vuelve a validar (CONTRASENA_DEBIL). */
export const esquemaContrasenaNueva = z
  .string()
  .min(8, v.minimo)
  .regex(/\p{Lu}/u, v.mayuscula)
  .regex(/\p{Ll}/u, v.minuscula)
  .regex(/\p{Nd}/u, v.numero)
  .regex(/[^\p{L}\p{Nd}\s]/u, v.signo)
  // BCrypt solo usa 72 bytes: el backend limita a 64 caracteres y 72 bytes en UTF-8.
  .refine((c) => c.length <= 64 && new TextEncoder().encode(c).length <= 72, v.maximo);

export const esquemaCambioContrasena = z
  .object({
    contrasenaActual: z.string().min(1, v.actualRequerida),
    contrasenaNueva: esquemaContrasenaNueva,
    confirmacion: z.string(),
  })
  .refine((d) => d.confirmacion === d.contrasenaNueva, { message: v.noCoinciden, path: ["confirmacion"] })
  .refine((d) => d.contrasenaNueva !== d.contrasenaActual, {
    message: v.igualALaActual,
    path: ["contrasenaNueva"],
  });

export type DatosCambioContrasena = z.infer<typeof esquemaCambioContrasena>;
