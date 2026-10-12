import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { $api, api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EstadoError } from "@/components/ui/EstadoError";
import { useConfiguracion } from "@/features/configuracion/hooks/configuracion";
import { esConflictoDeVersion, MENSAJES_ERROR } from "@/lib/errores";

import { FormularioCotizacion } from "../components/FormularioCotizacion";
import { entradaDeCotizacion } from "../schemas/cotizacion";
import { TEXTOS_COTIZACIONES } from "../textos";

const N = TEXTOS_COTIZACIONES.nueva;

/**
 * Editar una cotización en Borrador o En evaluación (RF-88, P-46). En evaluación, el backend la
 * guarda como una versión nueva y conserva la anterior.
 */
export function Component() {
  const id = Number(useParams().id);
  const navegar = useNavigate();
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const [conflicto, setConflicto] = useState(false);
  const consulta = $api.useQuery("get", "/api/v1/cotizaciones/{id}", { params: { path: { id } } });
  const clienteId = consulta.data?.cliente?.id ?? 0;
  const cliente = $api.useQuery(
    "get",
    "/api/v1/clientes/{id}",
    { params: { path: { id: clienteId } } },
    { enabled: clienteId > 0 },
  );
  const configuracion = useConfiguracion();
  const error = errorDeConsultas(consulta, configuracion);
  if (error) return <EstadoError error={error} alReintentar={() => void consulta.refetch()} />;
  const c = consulta.data;
  if (!c || configuracion.isPending || (clienteId > 0 && cliente.isPending))
    return <CargandoLista filas={4} />;
  const consecutivo = c.consecutivo ?? "";

  return (
    <FormularioCotizacion
      key={c.version}
      titulo={N.tituloEditar(consecutivo)}
      consecutivo={consecutivo}
      textoGuardar={N.guardarCambios}
      clienteInicial={cliente.data ?? null}
      configuracion={configuracion.data}
      valoresIniciales={entradaDeCotizacion(c)}
      aviso={
        <>
          {conflicto && <Alerta tono="aviso">{MENSAJES_ERROR.conflicto}</Alerta>}
          {c.estado === "EN_EVALUACION" && (
            <Alerta tono="aviso">{N.nuevaVersion((c.numeroVersion ?? 1) + 1)}</Alerta>
          )}
        </>
      }
      alGuardar={async (datos) => {
        try {
          const { data } = await api.PUT("/api/v1/cotizaciones/{id}", {
            params: { path: { id } },
            body: { ...datos, version: c.version ?? 0 },
          });
          await clienteConsultas.invalidateQueries();
          avisar({
            titulo: N.guardada(data?.consecutivo ?? ""),
          });
          void navegar(`/cotizaciones/${String(id)}`);
        } catch (e) {
          if (!esConflictoDeVersion(e)) throw e;
          await consulta.refetch();
          setConflicto(true);
        }
      }}
    />
  );
}
