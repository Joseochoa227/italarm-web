import { Ban } from "lucide-react";
import { useState } from "react";

import { api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { Alerta } from "@/components/ui/Alerta";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { Boton } from "@/components/ui/Boton";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { Dialogo } from "@/components/ui/Dialogo";
import { mensajeDeError } from "@/lib/errores";

import { TEXTOS_COMPRAS } from "../textos";

const D = TEXTOS_COMPRAS.detalle;
type Compra = components["schemas"]["CompraVista"];

/**
 * Anular la compra (RF-71, RF-73): con motivo y confirmación si es anulable (CP-16); si no, el botón
 * queda deshabilitado con el motivo y la indicación de corregir con un ajuste (CP-17).
 */
export function AnularCompra({
  compra,
  alAnular,
}: {
  compra: Compra;
  alAnular: (compra: Compra | undefined) => Promise<void>;
}) {
  const avisar = useAvisar();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [errorMotivo, setErrorMotivo] = useState<string>();
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);
  const consecutivo = compra.consecutivo ?? "";

  if (!compra.anulable) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutro-700">
        <Boton disabled aria-describedby="motivo-no-anulable">
          <Ban aria-hidden size={16} />
          {D.anular}
        </Boton>
        <span id="motivo-no-anulable" className="flex-[1_1_200px]">
          {compra.motivoNoAnulable} {D.noAnulableAyuda}
        </span>
      </div>
    );
  }

  async function anular() {
    const texto = motivo.trim();
    if (!texto) {
      setErrorMotivo(D.motivoRequerido);
      return;
    }
    setError(null);
    setOcupado(true);
    try {
      const { data } = await api.POST("/api/v1/compras/{id}/anular", {
        params: { path: { id: compra.id ?? 0 } },
        body: { motivo: texto },
      });
      await alAnular(data);
      avisar({ titulo: D.anulada(consecutivo) });
      setAbierto(false);
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <Boton
        variante="peligro"
        onClick={() => {
          setAbierto(true);
        }}
      >
        <Ban aria-hidden size={16} />
        {D.anular}
      </Boton>
      <Dialogo
        abierto={abierto}
        alCambiar={setAbierto}
        titulo={D.anularTitulo(consecutivo)}
        descripcion={D.anularTexto}
      >
        <AreaTexto
          etiqueta={D.motivo}
          maxLength={300}
          value={motivo}
          error={errorMotivo}
          onChange={(e) => {
            setMotivo(e.target.value);
            setErrorMotivo(undefined);
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
            Cancelar
          </Boton>
          <Boton variante="peligro" ocupado={ocupado} onClick={() => void anular()}>
            {D.anular}
          </Boton>
        </div>
      </Dialogo>
    </>
  );
}
