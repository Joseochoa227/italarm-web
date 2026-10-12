import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";

import { $api, api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EstadoError } from "@/components/ui/EstadoError";
import { useConfiguracion } from "@/features/configuracion/hooks/configuracion";
import { useClaveIdempotencia } from "@/lib/idempotencia";

import { FormularioCotizacion } from "../components/FormularioCotizacion";
import { COTIZACION_VACIA, validezDe } from "../schemas/cotizacion";
import { TEXTOS_COTIZACIONES } from "../textos";

const N = TEXTOS_COTIZACIONES.nueva;

/** Nueva cotización (RF-80 a RF-86). Con `?clienteId=` llega con el cliente elegido. Queda en Borrador. */
export function Component() {
  const [parametros] = useSearchParams();
  const navegar = useNavigate();
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const { clave } = useClaveIdempotencia();
  const clienteId = Number(parametros.get("clienteId") ?? "");
  const conCliente = Number.isInteger(clienteId) && clienteId > 0;
  const cliente = $api.useQuery(
    "get",
    "/api/v1/clientes/{id}",
    { params: { path: { id: clienteId } } },
    { enabled: conCliente },
  );
  const configuracion = useConfiguracion();

  const error = errorDeConsultas(configuracion);
  if (error) return <EstadoError error={error} alReintentar={() => void configuracion.refetch()} />;
  // Se espera al cliente de la URL y a la Configuración para montar el formulario con sus valores.
  if ((conCliente && cliente.isPending) || configuracion.isPending) return <CargandoLista filas={4} />;
  return (
    <FormularioCotizacion
      titulo={N.titulo}
      textoGuardar={N.guardar}
      clienteInicial={cliente.data ?? null}
      configuracion={configuracion.data}
      valoresIniciales={{
        ...COTIZACION_VACIA,
        clienteId: cliente.data?.id ?? null,
        validezDias: validezDe(configuracion.data?.validezCotizacionDias),
      }}
      alGuardar={async (datos) => {
        const { data } = await api.POST("/api/v1/cotizaciones", {
          params: { header: { "Idempotency-Key": clave } },
          // D-04: el contrato pide version también al crear.
          body: { ...datos, version: 0 },
        });
        await clienteConsultas.invalidateQueries();
        if (data?.id !== undefined) {
          avisar({ titulo: N.guardada(data.consecutivo ?? "") });
          void navegar(`/cotizaciones/${String(data.id)}`);
        }
      }}
    />
  );
}
