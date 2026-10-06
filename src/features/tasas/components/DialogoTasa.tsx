import { useMutation } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";

import { $api, api } from "@/api/cliente";
import { comoErrorApi } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Casilla } from "@/components/ui/Casilla";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { Dialogo } from "@/components/ui/Dialogo";
import { EstadoError } from "@/components/ui/EstadoError";
import { leerDecimal } from "@/lib/decimal";
import { formatearDecimal, formatearFecha } from "@/lib/formato";

import { type Tasa, useRefrescarTasas } from "../hooks/consultasTasas";
import { NOMBRE_PAR, TEXTOS_TASAS } from "../textos";

const T = TEXTOS_TASAS.dialogo;

/** Qué se registra: la tasa del bolívar de hoy, la TRM manual de hoy o la corrección de una tasa. */
export type ModoTasa = { tipo: "VES" } | { tipo: "TRM" } | { tipo: "CORREGIR"; tasa: Tasa };

/** La tasa admite hasta 6 decimales (TasaCambio del backend). */
const OPCIONES = { maxDecimales: 6 } as const;

function leerTasa(texto: string): { valor: string | null; error: string | null } {
  if (texto.trim() === "") return { valor: null, error: T.requerido };
  const r = leerDecimal(texto, OPCIONES);
  if (r.error !== null) return { valor: null, error: r.error };
  if (!/[1-9]/.test(r.valor)) return { valor: null, error: T.mayorQueCero };
  return { valor: r.valor, error: null };
}

/**
 * Registro y corrección de tasas con doble confirmación (RF-35, guía §7):
 * (a) se digita dos veces y deben coincidir; si no, no se envía nada (CP-10);
 * (b) la vista previa muestra la anterior, la nueva y la variación;
 * (c) si supera el límite, hay que aceptarla expresamente para guardar (CP-11).
 */
export function DialogoTasa({
  modo,
  alCerrar,
  alCorregirHoy,
}: {
  modo: ModoTasa;
  alCerrar: () => void;
  /** Con TASA_YA_REGISTRADA se ofrece corregir la tasa de hoy. */
  alCorregirHoy?: () => void;
}) {
  const avisar = useAvisar();
  const refrescar = useRefrescarTasas();
  const [texto, setTexto] = useState("");
  const [repeticion, setRepeticion] = useState("");
  const [motivo, setMotivo] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  const par =
    modo.tipo === "VES" ? "USD_VES" : modo.tipo === "TRM" ? "USD_COP" : (modo.tasa.par ?? "USD_VES");
  const titulo =
    modo.tipo === "VES"
      ? T.tituloVes
      : modo.tipo === "TRM"
        ? T.tituloTrm
        : T.tituloCorregir(NOMBRE_PAR[par], modo.tasa.fecha ? formatearFecha(modo.tasa.fecha) : "");

  const primera = leerTasa(texto);
  const segunda = leerTasa(repeticion);
  const coinciden = primera.valor !== null && primera.valor === segunda.valor;
  const noCoinciden = primera.valor !== null && segunda.valor !== null && !coinciden;

  // Vista previa en cuanto las dos digitaciones coinciden (RF-35b). No guarda nada.
  const vistaPrevia = $api.useQuery(
    "post",
    "/api/v1/tasas/vista-previa",
    {
      body: {
        par,
        valor: primera.valor ?? "0",
        ...(modo.tipo === "CORREGIR" && modo.tasa.id !== undefined ? { tasaId: modo.tasa.id } : {}),
      },
    },
    { enabled: coinciden, staleTime: Infinity },
  );
  const variacion = coinciden ? vistaPrevia.data : undefined;
  const superaLimite = variacion?.superaLimite === true;

  const guardado = useMutation({
    mutationFn: async (valor: string) => {
      const cuerpo = { valor, confirmacion: valor, aceptarVariacion: superaLimite && acepta };
      if (modo.tipo === "VES") return (await api.POST("/api/v1/tasas/ves", { body: cuerpo })).data;
      if (modo.tipo === "TRM") return (await api.POST("/api/v1/tasas/trm", { body: cuerpo })).data;
      const motivoLimpio = motivo.trim();
      return (
        await api.POST("/api/v1/tasas/{id}/corregir", {
          params: { path: { id: modo.tasa.id ?? 0 } },
          body: { ...cuerpo, ...(motivoLimpio ? { motivo: motivoLimpio } : {}) },
        })
      ).data;
    },
    onSuccess: async () => {
      await refrescar();
      avisar({ titulo: modo.tipo === "CORREGIR" ? T.corregida : T.registrada });
      alCerrar();
    },
  });

  function guardar() {
    setIntentoGuardar(true);
    // Doble digitación: si no coinciden, no se envía nada (CP-10).
    if (!coinciden || primera.valor === null) return;
    if (superaLimite && !acepta) return;
    guardado.mutate(primera.valor);
  }

  const error = guardado.error ? comoErrorApi(guardado.error) : null;
  // Los errores de formato se muestran al escribir; el de campo vacío, solo al intentar guardar.
  const errorPrimera = texto !== "" || intentoGuardar ? primera.error : null;
  const errorSegunda = repeticion !== "" || intentoGuardar ? segunda.error : null;

  return (
    <Dialogo
      abierto
      alCambiar={(abierto) => {
        if (!abierto) alCerrar();
      }}
      titulo={titulo}
      descripcion={par === "USD_VES" ? T.unidadVes : T.unidadTrm}
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          guardar();
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <Campo
            etiqueta={T.tasa}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
            }}
            error={errorPrimera ?? undefined}
            className="[&_input]:min-h-[48px] [&_input]:text-lg"
          />
          <Campo
            etiqueta={T.repite}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            value={repeticion}
            onChange={(e) => {
              setRepeticion(e.target.value);
            }}
            error={errorSegunda ?? undefined}
            className="[&_input]:min-h-[48px] [&_input]:text-lg"
          />
        </div>
        <p className="m-0 text-xs text-neutro-700">
          {primera.valor ? T.seGuardara(formatearDecimal(primera.valor)) : T.ayudaFormato}
        </p>

        {noCoinciden && (
          <Alerta tono="aviso" rol="alert">
            {T.noCoinciden}
          </Alerta>
        )}

        {variacion && (
          <dl className="m-0 grid grid-cols-3 gap-2 rounded-md border border-divisor p-3 text-sm">
            <div>
              <dt className="text-xs text-neutro-700">{T.anterior}</dt>
              <dd className="m-0 font-medium">
                {variacion.anterior ? formatearDecimal(variacion.anterior) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutro-700">{T.nueva}</dt>
              <dd className="m-0 font-medium">{variacion.nueva ? formatearDecimal(variacion.nueva) : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutro-700">{T.variacion}</dt>
              <dd className="m-0 font-medium">
                {variacion.porcentaje ? `${formatearDecimal(variacion.porcentaje)} %` : "—"}
              </dd>
            </div>
            {!variacion.anterior && <p className="col-span-3 m-0 text-xs text-neutro-700">{T.sinAnterior}</p>}
          </dl>
        )}
        {coinciden && vistaPrevia.isError && <EstadoError error={vistaPrevia.error} />}

        {variacion?.superaLimite === true && (
          <div
            role="alert"
            className="flex flex-col gap-1 rounded-md border border-peligro-300 bg-peligro-100 px-4 py-3 text-peligro-900"
          >
            <div className="flex items-start gap-2 text-sm font-medium">
              <TriangleAlert aria-hidden size={18} className="mt-0.5 shrink-0 text-peligro-700" />
              {T.alertaVariacion(
                formatearDecimal(variacion.porcentaje ?? "0"),
                formatearDecimal(variacion.limite ?? "0"),
              )}
            </div>
            <Casilla
              etiqueta={T.aceptar(formatearDecimal(variacion.porcentaje ?? "0"))}
              checked={acepta}
              onChange={(e) => {
                setAcepta(e.target.checked);
              }}
            />
          </div>
        )}

        {modo.tipo === "CORREGIR" && (
          <Campo
            etiqueta={T.motivo}
            value={motivo}
            maxLength={300}
            onChange={(e) => {
              setMotivo(e.target.value);
            }}
          />
        )}

        {error?.codigo === "TASA_YA_REGISTRADA" ? (
          <Alerta
            tono="aviso"
            rol="alert"
            accion={
              alCorregirHoy && (
                <Boton variante="primario" onClick={alCorregirHoy}>
                  {TEXTOS_TASAS.corregirVesHoy}
                </Boton>
              )
            }
          >
            {T.yaRegistrada}
          </Alerta>
        ) : (
          error && <EstadoError error={error} />
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Boton onClick={alCerrar}>{T.cancelar}</Boton>
          <Boton
            type="submit"
            variante="primario"
            ocupado={guardado.isPending}
            disabled={coinciden && (vistaPrevia.isFetching || (superaLimite && !acepta))}
          >
            {T.guardar}
          </Boton>
        </div>
      </form>
    </Dialogo>
  );
}
