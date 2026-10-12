import { Link } from "react-router";

import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { EstadoError } from "@/components/ui/EstadoError";
import { formatearDineroDe, formatearFecha } from "@/lib/formato";

import { TEXTOS_COTIZACIONES } from "../textos";
import { EstadoCotizacion } from "./EstadoCotizacion";

const T = TEXTOS_COTIZACIONES.cliente;

/** Últimas cotizaciones de un cliente en su detalle (P-36), con el enlace al listado filtrado. */
export function CotizacionesCliente({ clienteId, nombre }: { clienteId: number; nombre: string }) {
  const consulta = $api.useQuery("get", "/api/v1/cotizaciones", {
    params: { query: { clienteId, page: 0, size: 5, sort: ["id,desc"] } },
  });
  const error = errorDeConsultas(consulta);
  const cotizaciones = consulta.data?.contenido ?? [];
  return (
    <section aria-labelledby="titulo-cotizaciones" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-cotizaciones" className="m-0 text-[22px]">
          {T.titulo}
        </h2>
        {(consulta.data?.totalElementos ?? 0) > 0 && (
          <EnlaceBoton
            a={`/cotizaciones?cliente=${String(clienteId)}&clienteNombre=${encodeURIComponent(nombre)}`}
          >
            {T.verTodas}
          </EnlaceBoton>
        )}
      </div>
      {error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista filas={2} />
      ) : cotizaciones.length === 0 ? (
        <p className="m-0 text-sm text-neutro-700">{T.vacio}</p>
      ) : (
        <ul aria-label={T.titulo} className="m-0 list-none border-t border-divisor p-0">
          {cotizaciones.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-divisor py-3 text-sm"
            >
              <Link to={`/cotizaciones/${String(c.id)}`} className="min-w-[110px] font-medium">
                {c.consecutivo}
              </Link>
              <span className="min-w-[160px] flex-1">
                {[c.tipo ? TEXTOS_COTIZACIONES.tipos[c.tipo] : null, c.fecha ? formatearFecha(c.fecha) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <EstadoCotizacion estado={c.estado} />
              <span className="font-medium">{c.total ? formatearDineroDe(c.total) : ""}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
