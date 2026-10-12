import { Download } from "lucide-react";
import { useState } from "react";

import { Boton } from "@/components/ui/Boton";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { guardarArchivo, nombreDeArchivo } from "@/lib/descargas";
import { mensajeDeError } from "@/lib/errores";

import { TEXTOS_REPORTES } from "../textos";

const T = TEXTOS_REPORTES.excel;

/**
 * Botón Excel de un listado o reporte (RF-144, RNF-06, guía §20): pide el `.xlsx` con la sesión y los
 * mismos filtros de la pantalla, y lo guarda con el nombre que da el backend. Si pasa del límite de
 * filas, el backend responde EXPORTACION_MUY_GRANDE y se muestra su mensaje (P-62).
 */
export function BotonExcel({
  obtener,
  nombre,
}: {
  /** `api.GET(".../excel", { params, parseAs: "blob" })`. */
  obtener: () => Promise<{ data?: unknown; response: Response }>;
  /** Nombre si el backend no lo envía. */
  nombre: string;
}) {
  const avisar = useAvisar();
  const [ocupado, setOcupado] = useState(false);

  async function descargar() {
    setOcupado(true);
    try {
      const { data, response } = await obtener();
      const archivo =
        data instanceof Blob
          ? data
          : new Blob([], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      guardarArchivo(archivo, nombreDeArchivo(response.headers.get("Content-Disposition"), `${nombre}.xlsx`));
    } catch (e) {
      avisar({ titulo: mensajeDeError(e), tono: "error" });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Boton
      ocupado={ocupado}
      aria-label={ocupado ? T.descargando : undefined}
      onClick={() => void descargar()}
    >
      <Download aria-hidden size={16} />
      {T.boton}
    </Boton>
  );
}
