import { Check, ScanBarcode } from "lucide-react";
import { useState } from "react";

import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { Escaner } from "@/components/seriales/Escaner";
import { TEXTOS_SERIALES } from "@/components/seriales/textos";
import { Boton } from "@/components/ui/Boton";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EstadoError } from "@/components/ui/EstadoError";
import { cx } from "@/lib/clases";
import { normalizarSerial } from "@/lib/seriales";

import { TEXTOS_COMERCIAL } from "../textos";

const T = TEXTOS_COMERCIAL.seriales;

/**
 * Seriales que salen en una venta, instalación o cotización (RF-21, RF-22): solo los que están en
 * bodega (CP-14). Se marcan tocándolos o leyéndolos con la cámara; la cantidad es la de los marcados.
 */
export function SerialesQueSalen({
  productoId,
  producto,
  seleccionados,
  alCambiar,
  error,
}: {
  productoId: number;
  /** Nombre del producto, para las etiquetas accesibles. */
  producto: string;
  seleccionados: readonly string[];
  alCambiar: (seriales: string[]) => void;
  error?: string | undefined;
}) {
  const [escaneando, setEscaneando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const consulta = $api.useQuery("get", "/api/v1/inventario/productos/{id}/seriales", {
    params: { path: { id: productoId }, query: { estado: "EN_BODEGA" } },
  });
  const falla = errorDeConsultas(consulta);
  const enBodega = (consulta.data ?? []).flatMap((s) => (s.numero ? [s.numero] : []));

  const alternar = (numero: string) => {
    setMensaje(null);
    alCambiar(
      seleccionados.includes(numero) ? seleccionados.filter((s) => s !== numero) : [...seleccionados, numero],
    );
  };

  return (
    <fieldset className="m-0 flex flex-col gap-2 rounded-md border border-divisor p-3">
      <legend className="px-1 text-xs">
        {T.titulo} · {producto}
      </legend>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-neutro-700">{T.elegidos(seleccionados.length)}</span>
        <Boton
          variante="fantasma"
          className="ml-auto"
          disabled={enBodega.length === 0}
          onClick={() => {
            setEscaneando(true);
          }}
        >
          <ScanBarcode aria-hidden size={16} />
          {TEXTOS_SERIALES.escanear}
        </Boton>
      </div>
      {falla ? (
        <EstadoError error={falla} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista filas={1} />
      ) : enBodega.length === 0 ? (
        <p className="m-0 text-sm text-neutro-700">{T.vacio}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {enBodega.map((numero) => {
            const marcado = seleccionados.includes(numero);
            return (
              <button
                key={numero}
                type="button"
                aria-pressed={marcado}
                aria-label={`${T.serial(numero)} de ${producto}`}
                onClick={() => {
                  alternar(numero);
                }}
                className={cx(
                  "inline-flex min-h-[40px] cursor-pointer items-center gap-1 rounded-md border px-2.5 font-mono text-[13px]",
                  marcado ? "border-acento-700 bg-acento-700 text-fondo" : "border-divisor hover:bg-tinta/7",
                )}
              >
                {marcado && <Check aria-hidden size={14} />}
                {numero}
              </button>
            );
          })}
        </div>
      )}
      {mensaje && (
        <p role="status" className="m-0 text-xs font-medium text-acento-900">
          {mensaje}
        </p>
      )}
      {error && (
        <p role="alert" className="m-0 text-xs font-medium text-peligro-700">
          {error}
        </p>
      )}
      {escaneando && (
        <Escaner
          alCerrar={() => {
            setEscaneando(false);
          }}
          alLeer={(texto) => {
            setEscaneando(false);
            const numero = normalizarSerial(texto);
            if (!enBodega.includes(numero)) {
              setMensaje(T.noEnBodega(numero));
            } else {
              if (!seleccionados.includes(numero)) alCambiar([...seleccionados, numero]);
              setMensaje(T.elegido(numero));
            }
          }}
        />
      )}
    </fieldset>
  );
}
