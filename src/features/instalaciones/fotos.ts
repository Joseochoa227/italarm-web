import { comoFormulario } from "@/api/archivos";
import { api } from "@/api/cliente";

export const GRUPOS = ["ANTES", "DURANTE", "DESPUES"] as const;
export type GrupoFoto = (typeof GRUPOS)[number];
/** Máximo de fotos por grupo (P-42). */
export const MAXIMO_POR_GRUPO = 30;

export interface FotoGaleria {
  clave: string;
  url: string;
}

/** Sube una foto ya comprimida a un grupo de la instalación (guía §15). */
export async function subirFoto(id: number, grupo: GrupoFoto, archivo: File) {
  return (
    await api.POST("/api/v1/instalaciones/{id}/fotos", {
      params: { path: { id }, query: { grupo } },
      body: { archivo },
      bodySerializer: comoFormulario,
    })
  ).data;
}
