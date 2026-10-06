import { z } from "zod";

import { zCorreoOpcional, zTexto, zTextoOpcional } from "@/lib/esquemas";

import { TEXTOS_CLIENTES } from "../textos";

const V = TEXTOS_CLIENTES.validacion;

/** Cliente (3.10) con los límites de SolicitudCliente del backend. */
export const esquemaCliente = z.object({
  tipo: z.enum(["INSTALADOR", "CLIENTE_FINAL"]),
  nombre: zTexto(V.nombre, 150, V.largo(150)),
  tipoDocumento: z.enum(["", "CC", "NIT"]).transform((t) => (t === "" ? undefined : t)),
  numeroDocumento: zTextoOpcional(30, V.largo(30)).refine(
    (d) => d === undefined || /^[0-9.\s-]*$/.test(d),
    V.documento,
  ),
  telefono: zTexto(V.telefono, 25, V.largo(25)),
  correo: zCorreoOpcional(V.correo),
  direccion: zTextoOpcional(200, V.largo(200)),
  ciudad: zTextoOpcional(80, V.largo(80)),
});

export type EntradaCliente = z.input<typeof esquemaCliente>;
export type DatosCliente = z.output<typeof esquemaCliente>;
