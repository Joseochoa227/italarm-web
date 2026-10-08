/** Textos de la captura de seriales y del escáner (BF-17). */
export const TEXTOS_SERIALES = {
  titulo: "Seriales",
  progreso: (llenos: number, total: number) => `${String(llenos)} de ${String(total)}`,
  completos: "Completos",
  unidad: (n: number) => `Serial ${String(n)}`,
  repetido: "Repetido",
  escanear: "Escanear",
  ayuda: "Un serial por unidad. Se guardan en mayúsculas.",
} as const;

export const TEXTOS_ESCANER = {
  titulo: "Escanear código",
  instrucciones: "Apunta la cámara al código de barras del serial.",
  sinCamara:
    "No se pudo usar la cámara. Revisa el permiso del navegador o escribe el serial a mano. (La cámara necesita HTTPS, salvo en este mismo equipo.)",
} as const;
