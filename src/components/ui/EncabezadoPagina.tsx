import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

/** Título de pantalla con subtítulo, enlace de regreso y acciones, como el prototipo. */
export function EncabezadoPagina({
  titulo,
  subtitulo,
  volver,
  acciones,
  antetitulo,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  volver?: { a: string; etiqueta: string };
  acciones?: ReactNode;
  antetitulo?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {volver && (
        <Link
          to={volver.a}
          className="inline-flex min-h-[32px] items-center gap-1 self-start text-sm text-acento-700 no-underline"
        >
          <ChevronLeft aria-hidden size={16} />
          {volver.etiqueta}
        </Link>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          {antetitulo && <div className="rotulo text-acento-700">{antetitulo}</div>}
          <h1 className="m-0 text-[30px] escritorio:text-[36px]">{titulo}</h1>
          {subtitulo && <p className="m-0 text-sm text-neutro-700">{subtitulo}</p>}
        </div>
        {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
      </div>
    </div>
  );
}
