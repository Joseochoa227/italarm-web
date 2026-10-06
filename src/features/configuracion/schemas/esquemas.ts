import { z } from "zod";

import { zCorreoOpcional, zDecimal, zTexto, zTextoOpcional } from "@/lib/esquemas";

import { TEXTOS_CONFIGURACION } from "../textos";

const V = TEXTOS_CONFIGURACION.validacion;
const largo = V.largo;

/** Mismos límites que SolicitudConfiguracion del backend. */
export const esquemaEmpresa = z.object({
  empresaNombre: zTexto(V.nombre, 100, largo(100)),
  empresaLema: zTextoOpcional(150, largo(150)),
  empresaNit: zTextoOpcional(30, largo(30)),
  empresaCiudad: zTextoOpcional(80, largo(80)),
  empresaTelefono: zTextoOpcional(30, largo(30)),
  empresaCorreo: zCorreoOpcional(V.correo),
});

export const esquemaValores = z.object({
  validezCotizacionDias: z.enum(["8", "15", "30"]).transform(Number),
  garantiaManoObraMeses: z.enum(["1", "2", "3"]).transform(Number),
  garantiaEquiposMeses: z.enum(["1", "2", "3"]).transform(Number),
  limiteVariacionTasa: zDecimal({ maxDecimales: 2, requerido: V.limite }).refine(
    (v) => Number(v) > 0 && Number(v) <= 100,
    V.limiteRango,
  ),
  condicionesGarantia: zTexto(V.condiciones, 2000, largo(2000)),
  piePdf: zTexto(V.pie, 2000, largo(2000)),
});

const C = TEXTOS_CONFIGURACION.categorias;
export const esquemaCategoria = z.object({ nombre: zTexto(C.requerido, 80, largo(80)) });

const U = TEXTOS_CONFIGURACION.unidades;
export const esquemaUnidad = z.object({
  nombre: zTexto(U.requeridoNombre, 40, largo(40)),
  abreviatura: zTexto(U.requeridoAbreviatura, 10, largo(10)),
  admiteDecimales: z.boolean(),
});
