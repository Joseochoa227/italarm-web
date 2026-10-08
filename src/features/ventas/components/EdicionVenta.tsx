import { useState } from "react";

import { api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { Alerta } from "@/components/ui/Alerta";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { Boton } from "@/components/ui/Boton";
import { Casilla } from "@/components/ui/Casilla";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { esConflictoDeVersion, MENSAJES_ERROR, mensajeDeError } from "@/lib/errores";

import { MONEDAS } from "../schemas/venta";
import { TEXTOS_VENTAS } from "../textos";

const D = TEXTOS_VENTAS.detalle;
type Venta = components["schemas"]["VentaVista"];

/**
 * Lo único editable de una venta (RF-70): observaciones y monedas adicionales del comprobante
 * (P-34), con control de versión (BP-12). Se monta con `key={venta.version}`.
 */
export function EdicionVenta({
  venta,
  alGuardar,
  alConflicto,
  conflicto,
}: {
  venta: Venta;
  alGuardar: (venta: Venta | undefined) => Promise<void>;
  alConflicto: () => Promise<void>;
  conflicto: boolean;
}) {
  const avisar = useAvisar();
  const [observaciones, setObservaciones] = useState(venta.observaciones ?? "");
  const [monedas, setMonedas] = useState<string[]>(venta.monedasComprobante ?? []);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function guardar() {
    setError(null);
    setOcupado(true);
    try {
      const { data } = await api.PUT("/api/v1/ventas/{id}", {
        params: { path: { id: venta.id ?? 0 } },
        body: {
          observaciones: observaciones.trim(),
          monedasComprobante: MONEDAS.filter((m) => monedas.includes(m)),
          version: venta.version ?? 0,
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
      {conflicto && (
        <Alerta tono="aviso" rol="alert">
          {MENSAJES_ERROR.conflicto}
        </Alerta>
      )}
      <fieldset className="m-0 flex flex-col border-0 p-0">
        <legend className="mb-1 text-xs text-tinta/70">{TEXTOS_VENTAS.nueva.comprobante}</legend>
        <div className="flex flex-wrap gap-x-4">
          {MONEDAS.filter((m) => m !== venta.moneda).map((m) => (
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
        etiqueta={TEXTOS_VENTAS.nueva.observaciones}
        maxLength={500}
        rows={2}
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
