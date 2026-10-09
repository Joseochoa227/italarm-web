import { useState } from "react";

import { api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { Alerta } from "@/components/ui/Alerta";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Casilla } from "@/components/ui/Casilla";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { MONEDAS } from "@/features/comercial/schemas/material";
import { TEXTOS_COMERCIAL } from "@/features/comercial/textos";
import { esConflictoDeVersion, MENSAJES_ERROR, mensajeDeError } from "@/lib/errores";

import { TEXTOS_INSTALACIONES } from "../textos";
import { SelectorTecnicos } from "./SelectorTecnicos";

const D = TEXTOS_INSTALACIONES.detalle;
const N = TEXTOS_INSTALACIONES.nueva;
type Instalacion = components["schemas"]["InstalacionVista"];

/**
 * Lo editable de una instalación (RF-122, P-44): dirección, técnicos, descripción, condiciones,
 * observaciones y monedas del comprobante, con control de versión. Se monta con `key={version}`.
 */
export function EdicionInstalacion({
  instalacion,
  conflicto,
  alGuardar,
  alConflicto,
}: {
  instalacion: Instalacion;
  conflicto: boolean;
  alGuardar: (instalacion: Instalacion | undefined) => Promise<void>;
  alConflicto: () => Promise<void>;
}) {
  const avisar = useAvisar();
  const [direccion, setDireccion] = useState(instalacion.direccion ?? "");
  const [tecnicos, setTecnicos] = useState<number[]>(
    (instalacion.tecnicos ?? []).flatMap((t) => (t.id === undefined ? [] : [t.id])),
  );
  const [descripcion, setDescripcion] = useState(instalacion.descripcion ?? "");
  const [condiciones, setCondiciones] = useState(instalacion.garantias?.condiciones ?? "");
  const [observaciones, setObservaciones] = useState(instalacion.observaciones ?? "");
  const [monedas, setMonedas] = useState<string[]>(instalacion.monedasComprobante ?? []);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function guardar() {
    setError(null);
    setOcupado(true);
    try {
      const { data } = await api.PUT("/api/v1/instalaciones/{id}", {
        params: { path: { id: instalacion.id ?? 0 } },
        body: {
          direccion: direccion.trim(),
          tecnicos,
          descripcion: descripcion.trim(),
          condicionesGarantia: condiciones.trim(),
          observaciones: observaciones.trim(),
          monedasComprobante: MONEDAS.filter((m) => monedas.includes(m)),
          version: instalacion.version ?? 0,
        },
      });
      avisar({ titulo: D.guardado });
      await alGuardar(data);
    } catch (e) {
      if (esConflictoDeVersion(e)) await alConflicto();
      else setError(e);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Tarjeta className="gap-3">
      <h2 className="m-0 text-[22px]">{D.editar}</h2>
      <p className="m-0 text-xs text-neutro-700">{D.editarNota}</p>
      {conflicto && (
        <Alerta tono="aviso" rol="alert">
          {MENSAJES_ERROR.conflicto}
        </Alerta>
      )}
      <Campo
        etiqueta={N.direccion}
        value={direccion}
        maxLength={200}
        onChange={(e) => {
          setDireccion(e.target.value);
        }}
      />
      <SelectorTecnicos valor={tecnicos} alCambiar={setTecnicos} />
      <AreaTexto
        etiqueta={N.descripcion}
        rows={3}
        maxLength={2000}
        value={descripcion}
        onChange={(e) => {
          setDescripcion(e.target.value);
        }}
      />
      <AreaTexto
        etiqueta={N.condiciones}
        rows={2}
        maxLength={2000}
        value={condiciones}
        onChange={(e) => {
          setCondiciones(e.target.value);
        }}
      />
      <fieldset className="m-0 flex flex-col border-0 p-0">
        <legend className="mb-1 text-xs text-tinta/70">{TEXTOS_COMERCIAL.cobro.comprobante}</legend>
        <div className="flex flex-wrap gap-x-4">
          {MONEDAS.filter((m) => m !== instalacion.moneda).map((m) => (
            <Casilla
              key={m}
              etiqueta={m}
              checked={monedas.includes(m)}
              onChange={(e) => {
                setMonedas((actuales) =>
                  e.target.checked ? [...actuales, m] : actuales.filter((x) => x !== m),
                );
              }}
            />
          ))}
        </div>
      </fieldset>
      <AreaTexto
        etiqueta={TEXTOS_COMERCIAL.cobro.observaciones}
        rows={2}
        maxLength={500}
        value={observaciones}
        onChange={(e) => {
          setObservaciones(e.target.value);
        }}
      />
      {error !== null && (
        <Alerta tono="peligro" rol="alert">
          {mensajeDeError(error)}
        </Alerta>
      )}
      <Boton className="self-start" ocupado={ocupado} onClick={() => void guardar()}>
        {D.guardar}
      </Boton>
    </Tarjeta>
  );
}
