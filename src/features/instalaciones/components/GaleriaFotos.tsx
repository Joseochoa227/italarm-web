import { Camera, ImagePlus, X } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { Dialogo } from "@/components/ui/Dialogo";
import { mensajeDeError } from "@/lib/errores";
import { comprimirImagen, ErrorImagen, TIPOS_IMAGEN } from "@/lib/imagen";

import { type FotoGaleria, type GrupoFoto, GRUPOS, MAXIMO_POR_GRUPO } from "../fotos";
import { TEXTOS_INSTALACIONES } from "../textos";

const T = TEXTOS_INSTALACIONES.fotos;
function Grupo({
  grupo,
  fotos,
  alAgregar,
  alQuitar,
  alVer,
}: {
  grupo: GrupoFoto;
  fotos: readonly FotoGaleria[];
  alAgregar: (archivos: File[]) => Promise<void>;
  alQuitar: ((foto: FotoGaleria) => Promise<void>) | undefined;
  alVer: (indice: number) => void;
}) {
  const id = useId();
  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  const nombre = TEXTOS_INSTALACIONES.grupos[grupo];

  async function agregar(lista: FileList | null) {
    const archivos = [...(lista ?? [])];
    if (archivos.length === 0) return;
    setErrores([]);
    const espacio = MAXIMO_POR_GRUPO - fotos.length;
    const nuevos: File[] = [];
    const problemas: string[] = [];
    if (archivos.length > espacio) problemas.push(T.maximo(nombre));
    setOcupado(true);
    try {
      // Una por una: comprimir varias fotos grandes a la vez agota la memoria del celular.
      for (const archivo of archivos.slice(0, Math.max(espacio, 0))) {
        try {
          nuevos.push(await comprimirImagen(archivo, "foto"));
        } catch (e) {
          problemas.push(`${archivo.name}: ${e instanceof ErrorImagen ? e.message : mensajeDeError(e)}`);
        }
      }
      if (nuevos.length > 0) await alAgregar(nuevos);
    } catch (e) {
      problemas.push(mensajeDeError(e));
    } finally {
      setErrores(problemas);
      setOcupado(false);
    }
  }

  return (
    <section
      aria-labelledby={`${id}-titulo`}
      className="flex flex-col gap-2 rounded-md border border-divisor p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 id={`${id}-titulo`} className="m-0 flex-1 text-base">
          {T.contador(nombre, fotos.length)}
        </h3>
        {[
          { ref: camara, icono: <Camera aria-hidden size={16} />, etiqueta: T.tomar(nombre), captura: true },
          {
            ref: galeria,
            icono: <ImagePlus aria-hidden size={16} />,
            etiqueta: T.elegir(nombre),
            captura: false,
          },
        ].map((b) => (
          <span key={b.etiqueta}>
            <input
              ref={b.ref}
              type="file"
              accept={b.captura ? "image/*" : TIPOS_IMAGEN.join(",")}
              {...(b.captura ? { capture: "environment" as const } : { multiple: true })}
              className="sr-only"
              tabIndex={-1}
              aria-label={b.etiqueta}
              onChange={(e) => {
                const lista = e.target.files;
                void agregar(lista).finally(() => {
                  e.target.value = "";
                });
              }}
            />
            <Boton
              variante="fantasma"
              icono
              aria-label={b.etiqueta}
              title={b.etiqueta}
              ocupado={ocupado && b.captura}
              disabled={ocupado || fotos.length >= MAXIMO_POR_GRUPO}
              onClick={() => b.ref.current?.click()}
            >
              {b.icono}
            </Boton>
          </span>
        ))}
      </div>
      {fotos.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2 p-0">
          {fotos.map((f, i) => (
            <li key={f.clave} className="relative aspect-square overflow-hidden rounded-md bg-superficie">
              <button
                type="button"
                aria-label={T.ver(nombre, i + 1)}
                onClick={() => {
                  alVer(i);
                }}
                className="size-full cursor-pointer p-0"
              >
                <img src={f.url} alt="" className="size-full object-cover" />
              </button>
              {alQuitar && (
                <button
                  type="button"
                  aria-label={T.quitar(nombre, i + 1)}
                  onClick={() => void alQuitar(f)}
                  className="absolute top-1 right-1 grid size-[32px] cursor-pointer place-items-center rounded-full bg-tinta/70 text-fondo"
                >
                  <X aria-hidden size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {errores.length > 0 && (
        <Alerta tono="peligro" rol="alert">
          <span className="flex flex-col">
            {errores.map((e) => (
              <span key={e}>{e}</span>
            ))}
          </span>
        </Alerta>
      )}
    </section>
  );
}

/**
 * Fotos de una instalación en tres grupos (RF-110 a RF-112, P-42): se toman con la cámara del celular
 * o se eligen de la galería, se comprimen en el navegador (BF-14) y cada grupo admite 30.
 */
export function GaleriaFotos({
  fotos,
  alAgregar,
  alQuitar,
}: {
  fotos: Record<GrupoFoto, readonly FotoGaleria[]>;
  alAgregar: (grupo: GrupoFoto, archivos: File[]) => Promise<void>;
  alQuitar?: (grupo: GrupoFoto, foto: FotoGaleria) => Promise<void>;
}) {
  const [viendo, setViendo] = useState<{ grupo: GrupoFoto; indice: number } | null>(null);
  const foto = viendo ? fotos[viendo.grupo][viendo.indice] : undefined;
  return (
    <div className="grid gap-3 escritorio:grid-cols-3">
      {GRUPOS.map((g) => (
        <Grupo
          key={g}
          grupo={g}
          fotos={fotos[g]}
          alAgregar={(archivos) => alAgregar(g, archivos)}
          alQuitar={alQuitar ? (f) => alQuitar(g, f) : undefined}
          alVer={(indice) => {
            setViendo({ grupo: g, indice });
          }}
        />
      ))}
      <Dialogo
        abierto={foto !== undefined}
        alCambiar={(abierto) => {
          if (!abierto) setViendo(null);
        }}
        titulo={viendo ? T.titulo(TEXTOS_INSTALACIONES.grupos[viendo.grupo], viendo.indice + 1) : ""}
        amplio
      >
        {foto && <img src={foto.url} alt="" className="max-h-[70dvh] w-full rounded-md object-contain" />}
      </Dialogo>
    </div>
  );
}
