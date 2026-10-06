import { z } from "zod";

import { esquemaContrasenaNueva } from "@/features/auth/schemas/esquemas";
import { TEXTOS_AUTH } from "@/features/auth/textos";
import { zTexto } from "@/lib/esquemas";

import { TEXTOS_USUARIOS } from "../textos";

const V = TEXTOS_USUARIOS.validacion;
const NO_COINCIDEN = { message: TEXTOS_AUTH.validacion.noCoinciden, path: ["confirmacion"] };

/** Nuevo usuario con la política de contraseñas (P-07, P-08). */
export const esquemaNuevoUsuario = z
  .object({
    nombre: zTexto(V.nombre, 100, V.nombreLargo),
    correo: z.string().trim().pipe(z.email(V.correo)),
    contrasena: esquemaContrasenaNueva,
    confirmacion: z.string(),
  })
  .refine((d) => d.confirmacion === d.contrasena, NO_COINCIDEN);

export const esquemaRestablecer = z
  .object({ contrasenaNueva: esquemaContrasenaNueva, confirmacion: z.string() })
  .refine((d) => d.confirmacion === d.contrasenaNueva, NO_COINCIDEN);
