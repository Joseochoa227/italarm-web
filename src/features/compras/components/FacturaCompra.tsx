import { ExternalLink, Paperclip, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";

import { api } from "@/api/cliente";
import { comoFormulario } from "@/api/archivos";
import type { components } from "@/api/esquema";
import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { Confirmacion } from "@/components/ui/Confirmacion";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { mensajeDeError } from "@/lib/errores";
import { ErrorImagen } from "@/lib/imagen";

import { prepararFactura, TIPOS_FACTURA } from "../factura";
import { TEXTOS_COMPRAS } from "../textos";

const D = TEXTOS_COMPRAS.detalle;
type Compra = components["schemas"]["CompraVista"];

/** Factura adjunta de la compra (RF-44, RF-70): ver, adjuntar o reemplazar, y quitar. */
export function FacturaCompra({
  compra,
  alCambiar,
}: {
  compra: Compra;
  alCambiar: (compra: Compra | undefined) => Promise<void>;
}) {
  const id = compra.id ?? 0;
  const idTitulo = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const avisar = useAvisar();
  const [ocupado, setOcupado] = useState<"subir" | "quitar" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  async function ejecutar(
    accion: "subir" | "quitar",
    tarea: () => Promise<Compra | undefined>,
    aviso: string,
  ) {
    setError(null);
    setOcupado(accion);
    try {
      await alCambiar(await tarea());
      avisar({ titulo: aviso });
      setConfirmando(false);
    } catch (e) {
      setError(e instanceof ErrorImagen ? e.message : mensajeDeError(e));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <Tarjeta aria-labelledby={idTitulo} role="region">
      <h2 id={idTitulo} className="m-0 text-[22px]">
        {D.archivo}
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        {compra.facturaUrl ? (
          <a
            href={compra.facturaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-1.5"
          >
            <ExternalLink aria-hidden size={16} />
            {D.verArchivo}
          </a>
        ) : (
          <span className="text-sm text-neutro-700">{D.sinArchivo}</span>
        )}
        <input
          ref={entrada}
          type="file"
          accept={TIPOS_FACTURA}
          className="sr-only"
          tabIndex={-1}
          aria-label={D.adjuntar}
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            e.target.value = "";
            if (!archivo) return;
            void ejecutar(
              "subir",
              async () =>
                (
                  await api.PUT("/api/v1/compras/{id}/factura", {
                    params: { path: { id } },
                    body: { archivo: await prepararFactura(archivo) },
                    bodySerializer: comoFormulario,
                  })
                ).data,
              D.archivoGuardado,
            );
          }}
        />
        <Boton
          ocupado={ocupado === "subir"}
          disabled={ocupado !== null}
          onClick={() => entrada.current?.click()}
        >
          <Paperclip aria-hidden size={16} />
          {compra.facturaUrl ? D.reemplazar : D.adjuntar}
        </Boton>
        {compra.facturaUrl && (
          <Boton
            variante="fantasma"
            disabled={ocupado !== null}
            onClick={() => {
              setConfirmando(true);
            }}
          >
            <Trash2 aria-hidden size={16} />
            {D.quitar}
          </Boton>
        )}
      </div>
      {error && (
        <Alerta tono="peligro" rol="alert">
          {error}
        </Alerta>
      )}
      <Confirmacion
        abierto={confirmando}
        alCambiar={setConfirmando}
        titulo={D.quitarTitulo}
        confirmar={D.quitar}
        ocupado={ocupado === "quitar"}
        peligro
        alConfirmar={() => {
          void ejecutar(
            "quitar",
            async () => (await api.DELETE("/api/v1/compras/{id}/factura", { params: { path: { id } } })).data,
            D.archivoQuitado,
          );
        }}
      >
        {D.quitarTexto}
      </Confirmacion>
    </Tarjeta>
  );
}
