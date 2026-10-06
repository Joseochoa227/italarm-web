import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Power, PowerOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { $api, api } from "@/api/cliente";
import { comoFormulario } from "@/api/archivos";
import { comoErrorApi, errorDeConsultas } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { Confirmacion } from "@/components/ui/Confirmacion";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { SelectorImagen } from "@/components/ui/SelectorImagen";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { esConflictoDeVersion } from "@/lib/errores";
import { formatearCantidad, formatearDineroDe } from "@/lib/formato";
import { sinIndefinidos } from "@/lib/objetos";

import { FormularioProducto } from "../components/FormularioProducto";
import { CLAVE_PRODUCTOS, type Producto, valoresDeProducto } from "../hooks/productos";
import type { DatosProducto } from "../schemas/producto";
import { TEXTOS_PRODUCTOS } from "../textos";

const F = TEXTOS_PRODUCTOS.formulario;

/** Editar producto: datos, foto, activar o desactivar y eliminar (RF-14, P-17). */
export function Component() {
  const id = Number(useParams().id);
  const avisar = useAvisar();
  const navegar = useNavigate();
  const clienteConsultas = useQueryClient();
  const consulta = $api.useQuery("get", "/api/v1/productos/{id}", { params: { path: { id } } });
  const [conflicto, setConflicto] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const actualizar = async (producto: Producto | undefined) => {
    if (producto) {
      const { queryKey } = $api.queryOptions("get", "/api/v1/productos/{id}", { params: { path: { id } } });
      clienteConsultas.setQueryData(queryKey, producto);
    }
    await clienteConsultas.invalidateQueries({
      queryKey: CLAVE_PRODUCTOS,
      exact: false,
      refetchType: "none",
    });
  };

  const guardado = useMutation({
    mutationFn: async (datos: DatosProducto) =>
      (
        await api.PUT("/api/v1/productos/{id}", {
          params: { path: { id } },
          body: { ...sinIndefinidos(datos), version: consulta.data?.version ?? 0 },
        })
      ).data,
    onMutate: () => {
      setConflicto(false);
    },
    onSuccess: async (producto) => {
      await actualizar(producto);
      avisar({ titulo: F.guardado });
    },
    onError: async (e) => {
      // Otro usuario lo guardó antes: se cargan los datos actuales (BP-12).
      if (esConflictoDeVersion(e)) {
        await consulta.refetch();
        setConflicto(true);
      }
    },
  });

  const estado = useMutation({
    mutationFn: async (activar: boolean) =>
      (
        await (activar
          ? api.POST("/api/v1/productos/{id}/activar", { params: { path: { id } } })
          : api.POST("/api/v1/productos/{id}/desactivar", { params: { path: { id } } }))
      ).data,
    onSuccess: async (producto, activar) => {
      await actualizar(producto);
      avisar({ titulo: activar ? F.activado : F.desactivado });
    },
    onError: (e) => {
      avisar({ titulo: comoErrorApi(e).detalle ?? F.guardado, tono: "error" });
    },
  });

  const eliminacion = useMutation({
    mutationFn: async () => {
      await api.DELETE("/api/v1/productos/{id}", { params: { path: { id } } });
    },
    onSuccess: async () => {
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE_PRODUCTOS, exact: false });
      avisar({ titulo: F.eliminado });
      void navegar("/inventario", { replace: true });
    },
  });

  const errorCarga = errorDeConsultas(consulta);
  if (errorCarga) return <EstadoError error={errorCarga} alReintentar={() => void consulta.refetch()} />;
  const producto = consulta.data;
  if (!producto) return <CargandoLista filas={4} />;
  const activo = producto.activo !== false;
  const errorEliminar = eliminacion.error ? comoErrorApi(eliminacion.error) : null;

  return (
    <>
      <EncabezadoPagina
        titulo={F.tituloEditar}
        antetitulo={producto.codigo}
        volver={{ a: "/inventario", etiqueta: F.volver }}
        acciones={
          <>
            <Boton
              ocupado={estado.isPending}
              onClick={() => {
                estado.mutate(!activo);
              }}
            >
              {activo ? <PowerOff aria-hidden size={16} /> : <Power aria-hidden size={16} />}
              {activo ? F.desactivar : F.activar}
            </Boton>
            <Boton
              variante="fantasma"
              onClick={() => {
                eliminacion.reset();
                setEliminando(true);
              }}
            >
              <Trash2 aria-hidden size={16} />
              {F.eliminar}
            </Boton>
          </>
        }
      />
      {!activo && <Alerta tono="aviso">{F.inactivoAviso}</Alerta>}
      <FormularioProducto
        // Al recargar (guardado o conflicto de versión) el formulario se vuelve a montar con los datos actuales.
        key={producto.version}
        valores={valoresDeProducto(producto)}
        edicion
        ocupado={guardado.isPending}
        error={guardado.error ? comoErrorApi(guardado.error) : null}
        conflicto={conflicto}
        alGuardar={(datos) => {
          guardado.mutate(datos);
        }}
      >
        <Tarjeta>
          <SelectorImagen
            etiqueta={F.foto}
            uso="foto"
            url={producto.fotoUrl}
            alSubir={async (archivo) => {
              await actualizar(
                (
                  await api.PUT("/api/v1/productos/{id}/foto", {
                    params: { path: { id } },
                    body: { archivo },
                    bodySerializer: comoFormulario,
                  })
                ).data,
              );
            }}
            alQuitar={async () => {
              await actualizar(
                (await api.DELETE("/api/v1/productos/{id}/foto", { params: { path: { id } } })).data,
              );
            }}
          />
        </Tarjeta>
        <Tarjeta>
          <span className="rotulo text-acento-700">{F.soloLectura}</span>
          <dl className="m-0 grid gap-3 escritorio:grid-cols-2">
            <div>
              <dt className="text-xs text-neutro-700">{F.stockActual}</dt>
              <dd className="m-0 font-medium">
                {producto.stock ? formatearCantidad(producto.stock) : "0"}{" "}
                {producto.unidadMedida?.abreviatura}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutro-700">{F.costoActual}</dt>
              <dd className="m-0 font-medium">
                {producto.costoActual ? formatearDineroDe(producto.costoActual) : F.sinCosto}
              </dd>
            </div>
          </dl>
        </Tarjeta>
      </FormularioProducto>
      {eliminando && (
        <Confirmacion
          abierto
          alCambiar={setEliminando}
          titulo={F.confirmarEliminar(producto.nombre ?? "")}
          confirmar={F.eliminar}
          peligro
          ocupado={eliminacion.isPending}
          alConfirmar={() => {
            eliminacion.mutate();
          }}
        >
          {errorEliminar?.codigo === "PRODUCTO_CON_MOVIMIENTOS" ? (
            <Alerta
              tono="aviso"
              rol="alert"
              accion={
                activo && (
                  <Boton
                    variante="primario"
                    onClick={() => {
                      setEliminando(false);
                      estado.mutate(false);
                    }}
                  >
                    {F.desactivar}
                  </Boton>
                )
              }
            >
              {errorEliminar.detalle}
            </Alerta>
          ) : errorEliminar ? (
            <EstadoError error={errorEliminar} />
          ) : (
            F.explicacionEliminar
          )}
        </Confirmacion>
      )}
    </>
  );
}
