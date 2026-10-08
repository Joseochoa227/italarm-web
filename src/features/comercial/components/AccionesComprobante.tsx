import { Download, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { components } from "@/api/esquema";
import { Boton } from "@/components/ui/Boton";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { guardarArchivo } from "@/lib/descargas";
import { mensajeDeError } from "@/lib/errores";
import { useEsEscritorio } from "@/lib/medios";

import { TEXTOS_COMERCIAL } from "../textos";

const T = TEXTOS_COMERCIAL.comprobante;
export interface PdfComprobante {
  blob: Blob;
  nombre: string;
}

/** ¿El navegador puede compartir este archivo con las apps del celular (WhatsApp)? */
function puedeCompartir(archivo: File): boolean {
  return typeof navigator.canShare === "function" && navigator.canShare({ files: [archivo] });
}

/**
 * Descargar el comprobante en PDF (RF-133) y enviarlo por WhatsApp (RF-134, guía §14):
 * - en el celular, con el compartir del sistema y el PDF adjunto;
 * - en el computador, o si el navegador no comparte archivos, con el enlace público (P-33).
 */
export function AccionesComprobante({
  consecutivo,
  obtenerPdf,
  obtenerEnlace,
  bloque = false,
}: {
  consecutivo: string;
  obtenerPdf: () => Promise<PdfComprobante>;
  obtenerEnlace: () => Promise<components["schemas"]["EnlaceComprobanteVista"] | undefined>;
  bloque?: boolean;
}) {
  const avisar = useAvisar();
  const escritorio = useEsEscritorio();
  const [ocupado, setOcupado] = useState<"pdf" | "whatsapp" | null>(null);
  // En el celular el PDF se pide al abrir la pantalla: el compartir del sistema exige que se llame
  // justo después del toque, sin esperar la descarga.
  const pdf = useRef<Promise<PdfComprobante> | null>(null);
  const obtener = useRef(obtenerPdf);
  useEffect(() => {
    obtener.current = obtenerPdf;
  });
  useEffect(() => {
    if (!escritorio && typeof navigator.share === "function") {
      pdf.current = obtener.current();
      pdf.current.catch(() => {
        pdf.current = null;
      });
    }
  }, [escritorio]);

  const pedirPdf = () => {
    pdf.current ??= obtener.current();
    return pdf.current;
  };

  async function descargar() {
    setOcupado("pdf");
    try {
      const { blob, nombre } = await pedirPdf();
      guardarArchivo(blob, nombre);
    } catch (e) {
      pdf.current = null;
      avisar({ titulo: mensajeDeError(e), tono: "error" });
    } finally {
      setOcupado(null);
    }
  }

  async function enviarPorEnlace() {
    // La ventana se abre con el toque (si no, el navegador la bloquea) y se dirige al recibir el enlace.
    const ventana = window.open("", "_blank");
    try {
      const enlace = await obtenerEnlace();
      if (!enlace?.whatsappUrl) throw new Error("Sin enlace");
      if (ventana) {
        ventana.opener = null;
        ventana.location.href = enlace.whatsappUrl;
      } else {
        window.location.href = enlace.whatsappUrl;
      }
    } catch (e) {
      ventana?.close();
      throw e;
    }
  }

  async function enviar() {
    setOcupado("whatsapp");
    try {
      if (!escritorio && typeof navigator.share === "function") {
        const { blob, nombre } = await pedirPdf();
        const archivo = new File([blob], nombre, { type: "application/pdf" });
        if (puedeCompartir(archivo)) {
          await navigator.share({ files: [archivo], title: T.compartirTitulo(consecutivo) });
          return;
        }
      }
      await enviarPorEnlace();
    } catch (e) {
      // Cerrar el compartir del sistema no es un error.
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        avisar({ titulo: mensajeDeError(e), tono: "error" });
      }
    } finally {
      setOcupado(null);
    }
  }

  return (
    <>
      <Boton
        variante="primario"
        bloque={bloque}
        ocupado={ocupado === "whatsapp"}
        onClick={() => void enviar()}
      >
        <Send aria-hidden size={16} />
        {bloque ? T.whatsappLargo : T.whatsapp}
      </Boton>
      <Boton bloque={bloque} ocupado={ocupado === "pdf"} onClick={() => void descargar()}>
        <Download aria-hidden size={16} />
        {T.descargar}
      </Boton>
    </>
  );
}
