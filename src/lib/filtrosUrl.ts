import { useCallback } from "react";
import { useSearchParams } from "react-router";

/**
 * Filtros y página de un listado guardados en la URL: el botón Atrás conserva la búsqueda.
 * La página va de 1 en adelante en la URL; la API la recibe desde 0.
 */
export function useFiltrosUrl() {
  const [parametros, setParametros] = useSearchParams();

  const leer = useCallback((clave: string) => parametros.get(clave) ?? "", [parametros]);

  /** Cambia filtros (vacío = quitarlo). Cualquier cambio de filtro vuelve a la página 1. */
  const cambiar = useCallback(
    (cambios: Record<string, string>) => {
      setParametros(
        (actuales) => {
          const nuevos = new URLSearchParams(actuales);
          for (const [clave, valor] of Object.entries(cambios)) {
            if (valor === "") nuevos.delete(clave);
            else nuevos.set(clave, valor);
          }
          if (!("pagina" in cambios)) nuevos.delete("pagina");
          return nuevos;
        },
        { replace: true },
      );
    },
    [setParametros],
  );

  const pagina = Math.max(1, Number.parseInt(parametros.get("pagina") ?? "1", 10) || 1);

  const cambiarPagina = useCallback(
    (nueva: number) => {
      cambiar({ pagina: nueva <= 1 ? "" : String(nueva) });
    },
    [cambiar],
  );

  return { leer, cambiar, pagina, paginaApi: pagina - 1, cambiarPagina };
}
