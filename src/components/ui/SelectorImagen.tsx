import { ImageOff, ImageUp, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";

import { comoErrorApi } from "@/api/problema";
import { mensajeDeError } from "@/lib/errores";
import { comprimirImagen, ErrorImagen, TIPOS_IMAGEN } from "@/lib/imagen";

import { Alerta } from "./Alerta";
import { Boton } from "./Boton";

/**
 * Foto de producto o logo (guía §6): muestra la imagen actual (enlace firmado de 15 minutos),
 * la comprime antes de subirla (BF-14) y permite quitarla.
 */
export function SelectorImagen({
  etiqueta,
  url,
  uso,
  alSubir,
  alQuitar,
}: {
  etiqueta: string;
  url: string | null | undefined;
  uso: "foto" | "logo";
  alSubir: (archivo: File) => Promise<unknown>;
  alQuitar: () => Promise<unknown>;
}) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState<"subir" | "quitar" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ejecutar(accion: "subir" | "quitar", tarea: () => Promise<unknown>) {
    setError(null);
    setOcupado(accion);
    try {
      await tarea();
    } catch (e) {
      setError(e instanceof ErrorImagen ? e.message : mensajeDeError(comoErrorApi(e)));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-etiqueta`} className="text-xs text-tinta/70">
        {etiqueta}
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid size-[96px] shrink-0 place-items-center overflow-hidden rounded-md border border-divisor bg-superficie">
          {url ? (
            <img src={url} alt={etiqueta} className="size-full object-contain" />
          ) : (
            <ImageOff aria-label="Sin imagen" size={28} className="text-neutro-500" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={entrada}
            id={id}
            type="file"
            accept={TIPOS_IMAGEN.join(",")}
            aria-labelledby={`${id}-etiqueta`}
            className="sr-only"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              e.target.value = "";
              if (archivo) void ejecutar("subir", async () => alSubir(await comprimirImagen(archivo, uso)));
            }}
          />
          <Boton
            ocupado={ocupado === "subir"}
            disabled={ocupado !== null}
            onClick={() => entrada.current?.click()}
          >
            <ImageUp aria-hidden size={16} />
            {url ? "Cambiar imagen" : "Subir imagen"}
          </Boton>
          {url && (
            <Boton
              variante="fantasma"
              ocupado={ocupado === "quitar"}
              disabled={ocupado !== null}
              onClick={() => void ejecutar("quitar", alQuitar)}
            >
              <Trash2 aria-hidden size={16} />
              Quitar
            </Boton>
          )}
        </div>
      </div>
      <p className="m-0 text-xs text-neutro-700">
        JPEG, PNG o WebP, máximo 5 MB. Se comprime antes de subirla.
      </p>
      {error && (
        <Alerta tono="peligro" rol="alert">
          {error}
        </Alerta>
      )}
    </div>
  );
}
