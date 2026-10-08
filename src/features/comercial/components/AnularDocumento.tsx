import { Ban } from "lucide-react";
import { useState } from "react";

import { Alerta } from "@/components/ui/Alerta";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { Boton } from "@/components/ui/Boton";
import { Dialogo } from "@/components/ui/Dialogo";
import { mensajeDeError } from "@/lib/errores";

/**
 * Anular un documento con motivo (RF-73): el botón abre la confirmación, que exige el motivo y
 * explica qué pasa con el inventario. `alAnular` hace la petición; si falla, el error queda en el diálogo.
 */
export function AnularDocumento({
  textos,
  alAnular,
}: {
  textos: { anular: string; titulo: string; texto: string; motivo: string; motivoRequerido: string };
  alAnular: (motivo: string) => Promise<unknown>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [errorMotivo, setErrorMotivo] = useState<string>();
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);

  async function anular() {
    const texto = motivo.trim();
    if (!texto) {
      setErrorMotivo(textos.motivoRequerido);
      return;
    }
    setError(null);
    setOcupado(true);
    try {
      await alAnular(texto);
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
        {textos.anular}
      </Boton>
      <Dialogo abierto={abierto} alCambiar={setAbierto} titulo={textos.titulo} descripcion={textos.texto}>
        <AreaTexto
          etiqueta={textos.motivo}
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
            {textos.anular}
          </Boton>
        </div>
      </Dialogo>
    </>
  );
}
