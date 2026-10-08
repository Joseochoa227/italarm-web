import { Package, Plus } from "lucide-react";
import { useState } from "react";

import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { Boton } from "@/components/ui/Boton";
import { Buscador } from "@/components/ui/Buscador";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { Dialogo } from "@/components/ui/Dialogo";
import { EstadoError } from "@/components/ui/EstadoError";

import type { Producto } from "../hooks/productos";
import { TEXTOS_INVENTARIO } from "../textosInventario";

const T = TEXTOS_INVENTARIO.selector;

/** Agregar un producto activo a un documento, buscando por código o nombre. */
export function SelectorProducto({
  excluir,
  alElegir,
  etiqueta = T.agregar,
  soloActivos = true,
}: {
  /** Texto del botón que abre el selector. */
  etiqueta?: string;
  /** En los filtros también se buscan los inactivos. */
  soloActivos?: boolean;
  /** Productos ya agregados: una línea por producto (P-20). */
  excluir?: ReadonlySet<number>;
  alElegir: (producto: Producto) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [buscar, setBuscar] = useState("");
  const consulta = $api.useQuery(
    "get",
    "/api/v1/productos",
    {
      params: {
        query: { size: 10, page: 0, ...(soloActivos ? { activo: true } : {}), ...(buscar ? { buscar } : {}) },
      },
    },
    { enabled: abierto },
  );
  const error = errorDeConsultas(consulta);
  const productos = (consulta.data?.contenido ?? []).filter((p) => p.id !== undefined && !excluir?.has(p.id));

  return (
    <>
      <Boton
        onClick={() => {
          setAbierto(true);
        }}
      >
        <Plus aria-hidden size={16} />
        {etiqueta}
      </Boton>
      <Dialogo abierto={abierto} alCambiar={setAbierto} titulo={etiqueta}>
        <Buscador etiqueta={T.buscar} placeholder={T.buscar} valor={buscar} alBuscar={setBuscar} />
        {error ? (
          <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
        ) : consulta.isPending ? (
          <CargandoLista filas={3} />
        ) : productos.length === 0 ? (
          <p className="m-0 text-sm text-neutro-700">{T.vacio}</p>
        ) : (
          <ul
            aria-label={T.resultados}
            className="m-0 flex max-h-[50dvh] list-none flex-col gap-1 overflow-y-auto p-0"
          >
            {productos.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    alElegir(p);
                    setAbierto(false);
                    setBuscar("");
                  }}
                  className="flex min-h-[48px] w-full cursor-pointer items-center gap-3 rounded-md px-2 text-left hover:bg-tenue"
                >
                  <Package aria-hidden size={18} className="shrink-0 text-neutro-600" />
                  <span className="flex-1">
                    <span className="block font-medium">{p.nombre}</span>
                    <span className="block text-xs text-neutro-700">
                      {[p.codigo, p.controlaSerial ? T.conSerial : null, p.unidadMedida?.abreviatura]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dialogo>
    </>
  );
}
