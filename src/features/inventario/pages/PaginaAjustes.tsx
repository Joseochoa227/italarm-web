import { ClipboardList, X } from "lucide-react";

import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { FilaEnlace, ListaFilas } from "@/components/ui/ListaFilas";
import { Paginacion } from "@/components/ui/Paginacion";
import { useFiltrosUrl } from "@/lib/filtrosUrl";
import { formatearCantidad, formatearDineroDe, formatearFecha } from "@/lib/formato";

import { SelectorProducto } from "../components/SelectorProducto";
import { TEXTOS_INVENTARIO } from "../textosInventario";

const T = TEXTOS_INVENTARIO.ajustes;

/** Ajustes de inventario (RF-58): por producto y fechas. No se editan ni se anulan (P-24). */
export function Component() {
  const filtros = useFiltrosUrl();
  const producto = filtros.leer("producto");
  const productoNombre = filtros.leer("productoNombre");
  const desde = filtros.leer("desde");
  const hasta = filtros.leer("hasta");
  const consulta = $api.useQuery("get", "/api/v1/ajustes", {
    params: {
      query: {
        page: filtros.paginaApi,
        size: 20,
        ...(producto ? { productoId: Number(producto) } : {}),
        ...(desde ? { desde } : {}),
        ...(hasta ? { hasta } : {}),
      },
    },
  });
  const error = errorDeConsultas(consulta);
  const ajustes = consulta.data?.contenido ?? [];

  return (
    <>
      <EncabezadoPagina
        titulo={T.titulo}
        subtitulo={T.nota}
        volver={{ a: "/inventario", etiqueta: T.volver }}
      />
      <div className="flex flex-wrap items-end gap-3">
        {producto ? (
          <Boton
            aria-label={T.quitarProducto(productoNombre)}
            onClick={() => {
              filtros.cambiar({ producto: "", productoNombre: "" });
            }}
          >
            {T.producto}: {productoNombre}
            <X aria-hidden size={16} />
          </Boton>
        ) : (
          <SelectorProducto
            etiqueta={T.producto}
            soloActivos={false}
            alElegir={(p) => {
              filtros.cambiar({ producto: String(p.id), productoNombre: p.nombre ?? "" });
            }}
          />
        )}
        <Campo
          etiqueta={T.desde}
          type="date"
          value={desde}
          onChange={(e) => {
            filtros.cambiar({ desde: e.target.value });
          }}
          className="w-[160px]"
        />
        <Campo
          etiqueta={T.hasta}
          type="date"
          value={hasta}
          onChange={(e) => {
            filtros.cambiar({ hasta: e.target.value });
          }}
          className="w-[160px]"
        />
      </div>
      {error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : consulta.isPending ? (
        <CargandoLista />
      ) : ajustes.length === 0 ? (
        <EstadoVacio icono={<ClipboardList aria-hidden size={28} />} titulo={T.vacio} />
      ) : (
        <>
          <ListaFilas etiqueta={T.lista}>
            {ajustes.map((a) => (
              <FilaEnlace
                key={a.id}
                a={`/inventario/ajustes/${String(a.id)}`}
                etiqueta={`${a.consecutivo ?? ""} · ${a.producto?.nombre ?? ""}`}
              >
                <div className="flex min-w-[200px] flex-[2] flex-col">
                  <span className="font-medium">
                    {a.consecutivo} · {a.producto?.nombre}
                  </span>
                  <span className="text-xs text-neutro-700">
                    {[a.fecha ? formatearFecha(a.fecha) : null, a.motivoEtiqueta ?? a.motivo, a.registradoPor]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <span className="flex min-w-[140px] items-center gap-2">
                  <Etiqueta tono={a.tipo === "SALIDA" ? "neutro" : "acento"}>
                    {(a.tipo && T.tipos[a.tipo]) ?? a.tipo}
                  </Etiqueta>
                  {a.cantidad ? formatearCantidad(a.cantidad) : ""} {a.abreviatura}
                </span>
                <span className="min-w-[100px] text-right">
                  {a.valorUsd ? formatearDineroDe(a.valorUsd) : "—"}
                </span>
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
