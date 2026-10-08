import { useState } from "react";
import { Link } from "react-router";

import { $api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { errorDeConsultas } from "@/api/problema";
import { Boton } from "@/components/ui/Boton";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EstadoError } from "@/components/ui/EstadoError";
import { Tarjeta } from "@/components/ui/Tarjeta";

import { TEXTOS_INVENTARIO } from "../textosInventario";

const D = TEXTOS_INVENTARIO.detalle;

/** Seriales del producto por estado y su lista, con enlace al historial (RF-55). */
export function SerialesProducto({
  productoId,
  resumen,
}: {
  productoId: number;
  resumen: components["schemas"]["ProductoInventarioVistaSerialesPorEstado"] | undefined;
}) {
  const [verLista, setVerLista] = useState(false);
  const lista = $api.useQuery(
    "get",
    "/api/v1/inventario/productos/{id}/seriales",
    { params: { path: { id: productoId } } },
    { enabled: verLista },
  );
  const error = errorDeConsultas(lista);
  const estados = [
    [D.estadosSerial.enBodega, resumen?.enBodega],
    [D.estadosSerial.vendidos, resumen?.vendidos],
    [D.estadosSerial.instalados, resumen?.instalados],
    [D.estadosSerial.dadosDeBaja, resumen?.dadosDeBaja],
    [D.estadosSerial.anulados, resumen?.anulados],
  ] as const;

  return (
    <Tarjeta>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="m-0 flex-1 text-[22px]">{D.seriales}</h2>
        <Boton
          variante="fantasma"
          onClick={() => {
            setVerLista((v) => !v);
          }}
        >
          {verLista ? D.ocultarSeriales : D.verSeriales}
        </Boton>
      </div>
      <dl className="m-0 flex flex-wrap gap-x-6 gap-y-2">
        {estados.map(([etiqueta, cantidad]) => (
          <div key={etiqueta}>
            <dt className="text-xs text-neutro-700">{etiqueta}</dt>
            <dd className="m-0 font-titulo text-xl font-semibold">{cantidad ?? 0}</dd>
          </div>
        ))}
      </dl>
      {verLista &&
        (error ? (
          <EstadoError error={error} alReintentar={() => void lista.refetch()} />
        ) : lista.isPending ? (
          <CargandoLista filas={3} />
        ) : (lista.data ?? []).length === 0 ? (
          <p className="m-0 text-sm text-neutro-700">{D.sinSeriales}</p>
        ) : (
          <ul aria-label={D.seriales} className="m-0 list-none border-t border-divisor p-0">
            {(lista.data ?? []).map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-x-4 border-b border-divisor py-2 text-sm"
              >
                <Link to={`/seriales/${String(s.id)}`} className="font-mono">
                  {s.numero}
                </Link>
                <span className="text-neutro-700">
                  {[
                    s.estado ? (TEXTOS_INVENTARIO.estadoSerial[s.estado] ?? s.estado) : null,
                    s.documentoSalida?.consecutivo ?? s.documentoEntrada?.consecutivo,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </Tarjeta>
  );
}
