import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { Casilla } from "@/components/ui/Casilla";
import { EstadoError } from "@/components/ui/EstadoError";

import { TEXTOS_INSTALACIONES } from "../textos";

/** Técnicos que hicieron la instalación (RF-107, P-37): usuarios activos, al menos uno. */
export function SelectorTecnicos({
  valor,
  alCambiar,
  error,
}: {
  valor: readonly number[];
  alCambiar: (tecnicos: number[]) => void;
  error?: string | undefined;
}) {
  const consulta = $api.useQuery("get", "/api/v1/usuarios/tecnicos");
  const falla = errorDeConsultas(consulta);
  return (
    <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
      <legend className="mb-1 text-xs text-tinta/70">{TEXTOS_INSTALACIONES.nueva.tecnicos}</legend>
      {falla ? (
        <EstadoError error={falla} alReintentar={() => void consulta.refetch()} />
      ) : (
        <div className="flex flex-wrap gap-x-5">
          {(consulta.data ?? []).map((t) =>
            t.id === undefined ? null : (
              <Casilla
                key={t.id}
                etiqueta={t.nombre ?? ""}
                checked={valor.includes(t.id)}
                onChange={(e) => {
                  const id = t.id ?? 0;
                  alCambiar(e.target.checked ? [...valor, id] : valor.filter((x) => x !== id));
                }}
              />
            ),
          )}
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
