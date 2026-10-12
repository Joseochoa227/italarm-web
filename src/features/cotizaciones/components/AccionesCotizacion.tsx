import { CircleCheck, CircleX, Copy, MessageCircle, Pencil, Repeat } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { comoErrorApi } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { Boton } from "@/components/ui/Boton";
import { Confirmacion } from "@/components/ui/Confirmacion";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { Dialogo } from "@/components/ui/Dialogo";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { Selector } from "@/components/ui/Selector";
import { AccionesComprobante } from "@/features/comercial/components/AccionesComprobante";
import { mensajeDeError } from "@/lib/errores";
import { useClaveIdempotencia } from "@/lib/idempotencia";

import { comprobanteCotizacion, enlaceCotizacion, marcarEnviada } from "../comprobante";
import { TEXTOS_COTIZACIONES } from "../textos";

const A = TEXTOS_COTIZACIONES.acciones;
type Cotizacion = components["schemas"]["CotizacionVista"];
type Motivo = "PRECIO" | "COMPETENCIA" | "OTRO";
const MOTIVOS = (["PRECIO", "COMPETENCIA", "OTRO"] as const).map((m) => ({
  valor: m,
  etiqueta: TEXTOS_COTIZACIONES.motivos[m] ?? m,
}));

/** ¿La acción falló porque la cotización cambió de estado mientras tanto? */
const esTransicionNoPermitida = (e: unknown) => comoErrorApi(e).codigo === "TRANSICION_NO_PERMITIDA";

function Rechazar({
  consecutivo,
  alRechazar,
}: {
  consecutivo: string;
  alRechazar: (motivo: Motivo | undefined, detalle: string) => Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState<Motivo | "">("");
  const [detalle, setDetalle] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<unknown>(null);
  return (
    <>
      <Boton
        variante="peligro"
        onClick={() => {
          setError(null);
          setAbierto(true);
        }}
      >
        <CircleX aria-hidden size={16} />
        {A.rechazar}
      </Boton>
      <Dialogo
        abierto={abierto}
        alCambiar={setAbierto}
        titulo={A.rechazarTitulo(consecutivo)}
        descripcion={A.rechazarTexto}
      >
        <Selector
          etiqueta={A.motivo}
          vacio={A.sinMotivo}
          opciones={MOTIVOS}
          value={motivo}
          onChange={(e) => {
            setMotivo(e.target.value as Motivo | "");
          }}
        />
        <AreaTexto
          etiqueta={A.detalle}
          maxLength={300}
          rows={2}
          value={detalle}
          onChange={(e) => {
            setDetalle(e.target.value);
          }}
        />
        {error !== null && (
          <Alerta tono="peligro" rol="alert">
            {mensajeDeError(error)}
          </Alerta>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Boton
            onClick={() => {
              setAbierto(false);
            }}
          >
            {A.cancelar}
          </Boton>
          <Boton
            variante="peligro"
            ocupado={ocupado}
            onClick={() => {
              setOcupado(true);
              setError(null);
              alRechazar(motivo || undefined, detalle.trim())
                .then(() => {
                  setAbierto(false);
                })
                .catch((e: unknown) => {
                  setError(e);
                })
                .finally(() => {
                  setOcupado(false);
                });
            }}
          >
            {A.rechazar}
          </Boton>
        </div>
      </Dialogo>
    </>
  );
}

/**
 * Acciones de la cotización según su estado (RF-87 a RF-93, guía §17). El backend tiene la última
 * palabra: si responde TRANSICION_NO_PERMITIDA, se avisa y se recarga la cotización.
 */
export function AccionesCotizacion({
  cotizacion: c,
  alCambiar,
  alDesactualizada,
}: {
  cotizacion: Cotizacion;
  /** Cotización que devolvió la acción (o undefined para volver a pedirla). */
  alCambiar: (nueva: Cotizacion | undefined) => Promise<void>;
  alDesactualizada: () => Promise<void>;
}) {
  const id = c.id ?? 0;
  const consecutivo = c.consecutivo ?? "";
  const estado = c.estado;
  const abierta = estado === "BORRADOR" || estado === "EN_EVALUACION";
  const avisar = useAvisar();
  const navegar = useNavigate();
  const { clave, renovar } = useClaveIdempotencia();
  const [aprobando, setAprobando] = useState(false);
  const [ocupado, setOcupado] = useState<"aprobar" | "duplicar" | "seguimiento" | null>(null);

  async function ejecutar<T>(accion: "aprobar" | "duplicar" | "seguimiento" | null, hacer: () => Promise<T>) {
    setOcupado(accion);
    try {
      return await hacer();
    } catch (e) {
      if (esTransicionNoPermitida(e)) {
        avisar({ titulo: A.transicion, tono: "error" });
        await alDesactualizada();
      } else {
        avisar({ titulo: mensajeDeError(e), tono: "error" });
      }
      return undefined;
    } finally {
      setOcupado(null);
    }
  }

  async function seguimiento() {
    // La ventana se abre con el toque (si no, el navegador la bloquea) y se dirige al recibir el mensaje.
    const ventana = window.open("", "_blank");
    const datos = await ejecutar("seguimiento", async () => {
      const { data } = await api.GET("/api/v1/cotizaciones/{id}/seguimiento", { params: { path: { id } } });
      if (!data?.whatsappUrl) throw new Error("Sin enlace");
      return data;
    });
    if (!datos?.whatsappUrl) {
      ventana?.close();
      return;
    }
    if (ventana) {
      ventana.opener = null;
      ventana.location.href = datos.whatsappUrl;
    } else {
      window.location.href = datos.whatsappUrl;
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <AccionesComprobante
        consecutivo={consecutivo}
        obtenerPdf={() => comprobanteCotizacion(id, consecutivo)}
        obtenerEnlace={async () => {
          const enlace = await enlaceCotizacion(id);
          // Enviar el enlace la pasa a En evaluación.
          await alCambiar(undefined);
          return enlace;
        }}
        {...(abierta
          ? {
              alEnviar: async () => {
                try {
                  await alCambiar(await marcarEnviada(id));
                } catch (e) {
                  if (!esTransicionNoPermitida(e)) throw e;
                  await alDesactualizada();
                }
              },
            }
          : {})}
      />
      {estado === "EN_EVALUACION" && (
        <Boton ocupado={ocupado === "seguimiento"} onClick={() => void seguimiento()}>
          <MessageCircle aria-hidden size={16} />
          {A.seguimiento}
        </Boton>
      )}
      {estado === "APROBADA" && (
        <EnlaceBoton
          a={`/${c.tipo === "VENTA" ? "ventas" : "instalaciones"}/nueva?cotizacionId=${String(id)}`}
          variante="primario"
          icono={<Repeat aria-hidden size={16} />}
        >
          {A.convertir(c.tipo ?? "")}
        </EnlaceBoton>
      )}
      {abierta && (
        <>
          <Boton
            onClick={() => {
              setAprobando(true);
            }}
          >
            <CircleCheck aria-hidden size={16} />
            {A.aprobar}
          </Boton>
          <EnlaceBoton a={`/cotizaciones/${String(id)}/editar`} icono={<Pencil aria-hidden size={16} />}>
            {A.editar}
          </EnlaceBoton>
        </>
      )}
      <Boton
        ocupado={ocupado === "duplicar"}
        onClick={() =>
          void ejecutar("duplicar", async () => {
            const { data } = await api.POST("/api/v1/cotizaciones/{id}/duplicar", {
              params: { path: { id }, header: { "Idempotency-Key": clave } },
            });
            renovar();
            await alCambiar(c);
            if (data?.id !== undefined) {
              avisar({ titulo: A.duplicada(data.consecutivo ?? "") });
              void navegar(`/cotizaciones/${String(data.id)}`);
            }
          })
        }
      >
        <Copy aria-hidden size={16} />
        {A.duplicar}
      </Boton>
      {(abierta || estado === "APROBADA") && (
        <Rechazar
          consecutivo={consecutivo}
          alRechazar={async (motivo, detalle) => {
            try {
              const { data } = await api.POST("/api/v1/cotizaciones/{id}/rechazar", {
                params: { path: { id } },
                body: { ...(motivo ? { motivo } : {}), ...(detalle ? { detalle } : {}) },
              });
              await alCambiar(data);
              avisar({ titulo: A.rechazada(consecutivo) });
            } catch (e) {
              if (!esTransicionNoPermitida(e)) throw e;
              avisar({ titulo: A.transicion, tono: "error" });
              await alDesactualizada();
            }
          }}
        />
      )}
      <Confirmacion
        abierto={aprobando}
        alCambiar={setAprobando}
        titulo={A.aprobarTitulo(consecutivo)}
        confirmar={A.aprobar}
        ocupado={ocupado === "aprobar"}
        alConfirmar={() =>
          void ejecutar("aprobar", async () => {
            const { data } = await api.POST("/api/v1/cotizaciones/{id}/aprobar", {
              params: { path: { id } },
            });
            await alCambiar(data);
            avisar({ titulo: A.aprobada(consecutivo) });
          }).finally(() => {
            setAprobando(false);
          })
        }
      >
        {A.aprobarTexto}
      </Confirmacion>
    </div>
  );
}
