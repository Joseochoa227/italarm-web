import { Plus, Truck } from "lucide-react";

import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { Buscador } from "@/components/ui/Buscador";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { FilaEnlace, ListaFilas } from "@/components/ui/ListaFilas";
import { Paginacion } from "@/components/ui/Paginacion";
import { useFiltrosUrl } from "@/lib/filtrosUrl";

import { TEXTOS_COMPRAS } from "../textos";

const P = TEXTOS_COMPRAS.proveedores;

/** Proveedores con su moneda habitual, NIT, ciudad y teléfono (RF-37). */
export function ListaProveedores() {
  const filtros = useFiltrosUrl();
  const buscar = filtros.leer("buscar");
  const consulta = $api.useQuery("get", "/api/v1/proveedores", {
    params: { query: { page: filtros.paginaApi, size: 20, ...(buscar ? { buscar } : {}) } },
  });
  const error = errorDeConsultas(consulta);
  const proveedores = consulta.data?.contenido ?? [];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Buscador
          etiqueta={P.buscar}
          placeholder={P.buscar}
          valor={buscar}
          alBuscar={(texto) => {
            filtros.cambiar({ buscar: texto });
          }}
        />
        <EnlaceBoton
          a="/compras/proveedores/nuevo"
          variante="primario"
          icono={<Plus aria-hidden size={16} />}
        >
          {P.nuevo}
        </EnlaceBoton>
      </div>
      {error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista />
      ) : proveedores.length === 0 ? (
        <EstadoVacio icono={<Truck aria-hidden size={28} />} titulo={buscar ? P.vacio : P.vacioSinFiltros} />
      ) : (
        <>
          <ListaFilas etiqueta={TEXTOS_COMPRAS.pestanas.proveedores}>
            {proveedores.map((p) => (
              <FilaEnlace
                key={p.id}
                a={`/compras/proveedores/${String(p.id)}/editar`}
                etiqueta={p.nombre ?? ""}
              >
                <div className="min-w-[200px] flex-[2]">
                  <div className="font-medium">{p.nombre}</div>
                  <div className="text-xs text-neutro-700">
                    {[p.nit && `${P.nit} ${p.nit}`, p.ciudad, p.telefono].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {p.monedaHabitual && <Etiqueta tono="acento">{p.monedaHabitual}</Etiqueta>}
              </FilaEnlace>
            ))}
          </ListaFilas>
          <Paginacion
            pagina={filtros.pagina}
            totalPaginas={consulta.data?.totalPaginas ?? 1}
            alCambiar={filtros.cambiarPagina}
          />
        </>
      )}
    </>
  );
}
