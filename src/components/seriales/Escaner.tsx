import { useEffect, useRef, useState } from "react";

import { Alerta } from "@/components/ui/Alerta";
import { Dialogo } from "@/components/ui/Dialogo";

import { TEXTOS_ESCANER } from "./textos";

/**
 * Lectura de códigos de barras con la cámara (BF-14), con @zxing/browser. La librería se carga
 * solo al abrir el escáner, para no pesar en la carga de la app.
 */
export function Escaner({ alLeer, alCerrar }: { alLeer: (texto: string) => void; alCerrar: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const lectura = useRef(alLeer);
  useEffect(() => {
    lectura.current = alLeer;
  });

  useEffect(() => {
    let detener: (() => void) | undefined;
    // Se cierra el escáner antes de que la cámara termine de abrir: no se deja encendida.
    const cierre = new AbortController();
    // Función (y no la propiedad) para que TypeScript no la dé por fija entre un await y otro.
    const cerrado = () => cierre.signal.aborted;
    void (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cerrado() || !video.current) return;
        const controles = await new BrowserMultiFormatReader().decodeFromVideoDevice(
          undefined,
          video.current,
          (resultado, _error, control) => {
            if (!resultado) return;
            control.stop();
            lectura.current(resultado.getText());
          },
        );
        detener = () => {
          controles.stop();
        };
        if (cerrado()) detener();
      } catch {
        if (!cerrado()) setError(true);
      }
    })();
    return () => {
      cierre.abort();
      detener?.();
    };
  }, []);

  return (
    <Dialogo
      abierto
      alCambiar={(abierto) => {
        if (!abierto) alCerrar();
      }}
      titulo={TEXTOS_ESCANER.titulo}
      descripcion={TEXTOS_ESCANER.instrucciones}
    >
      {error ? (
        <Alerta tono="peligro" rol="alert">
          {TEXTOS_ESCANER.sinCamara}
        </Alerta>
      ) : (
        <video
          ref={video}
          muted
          playsInline
          className="aspect-video w-full rounded-md bg-tinta object-cover"
        />
      )}
    </Dialogo>
  );
}
