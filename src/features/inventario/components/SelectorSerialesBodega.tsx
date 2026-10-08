import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { Casilla } from "@/components/ui/Casilla";
import { EstadoError } from "@/components/ui/EstadoError";

import { TEXTOS_INVENTARIO } from "../textosInventario";

const T = TEXTOS_INVENTARIO.serialesBodega;

/**
 * Elegir qué seriales salen (RF-21, RF-59): solo se muestran los que están en bodega, y la cantidad
 * es la de los elegidos.
 */
export function SelectorSerialesBodega({
  productoId,
  seleccionados,
  alCambiar,
  error,
}: {
  productoId: number;
  seleccionados: readonly string[];
  alCambiar: (seriales: string[]) => void;
  error?: string | undefined;
}) {
  const consulta = $api.useQuery("get", "/api/v1/inventario/productos/{id}/seriales", {
    params: { path: { id: productoId }, query: { estado: "EN_BODEGA" } },
  });
  const falla = errorDeConsultas(consulta);
  const seriales = (consulta.data ?? []).flatMap((s) => (s.numero ? [s.numero] : []));
  const elegidos = new Set(seleccionados);

  return (
    <fieldset className="m-0 flex flex-col gap-1 rounded-md border border-divisor p-3">
      <legend className="px-1 text-xs">{T.titulo}</legend>
      <span className="text-sm text-neutro-700">{T.elegidos(elegidos.size)}</span>
      {falla ? (
        <EstadoError error={falla} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista filas={2} />
      ) : seriales.length === 0 ? (
        <p className="m-0 text-sm text-neutro-700">{T.vacio}</p>
      ) : (
        <div className="grid escritorio:grid-cols-2">
          {seriales.map((numero) => (
            <Casilla
              key={numero}
              etiqueta={<span className="font-mono">{numero}</span>}
              checked={elegidos.has(numero)}
              onChange={(e) => {
                alCambiar(
                  e.target.checked ? [...seleccionados, numero] : seleccionados.filter((s) => s !== numero),
                );
              }}
            />
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="m-0 text-xs font-medium text-peligro-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
