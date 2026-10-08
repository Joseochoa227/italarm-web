import { EllipsisVertical } from "lucide-react";
import { NavLink } from "react-router";

import { useSesion } from "@/features/auth/hooks/contextoSesion";
import { RecuadroTasas } from "@/features/tasas/components/RecuadroTasas";
import { cx } from "@/lib/clases";
import { inicial } from "@/lib/texto";

import { BotonBuscarSerial } from "./BotonBuscarSerial";
import { MenuUsuario } from "./MenuUsuario";
import { MENU_LATERAL, TEXTOS_NAVEGACION } from "./navegacion";

/** Menú lateral fijo del computador (RF-01), según el prototipo. */
export function MenuLateral() {
  const { usuario } = useSesion();
  return (
    <aside className="sticky top-0 flex h-dvh w-[240px] flex-none flex-col gap-5 overflow-y-auto border-r border-divisor px-4 py-6">
      <div className="flex flex-col gap-0.5 px-2.5">
        <span className="marca text-[26px]">ITALARM</span>
        <span className="text-[11px] tracking-[0.08em] text-neutro-700 uppercase">
          {TEXTOS_NAVEGACION.marcaSubtitulo}
        </span>
      </div>
      <BotonBuscarSerial conTexto />
      <nav aria-label={TEXTOS_NAVEGACION.menuPrincipal} className="flex flex-col gap-0.5">
        {MENU_LATERAL.map(({ ruta, etiqueta, icono: Icono }) => (
          <NavLink
            key={ruta}
            to={ruta}
            end={ruta === "/"}
            className={({ isActive }) =>
              cx(
                "flex min-h-[40px] items-center gap-2.5 rounded-md px-2.5 text-sm no-underline",
                isActive
                  ? "bg-acento-100 font-semibold text-acento-800 hover:text-acento-800"
                  : "text-tinta hover:bg-tenue hover:text-tinta",
              )
            }
          >
            <Icono aria-hidden size={18} />
            <span className="flex-1">{etiqueta}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-4">
        <RecuadroTasas />
        <div className="flex items-center gap-2.5 px-1">
          <span
            aria-hidden
            className="grid size-8 flex-none place-items-center rounded-full border border-divisor font-titulo font-semibold"
          >
            {inicial(usuario?.nombre)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{usuario?.nombre}</div>
            <div className="truncate text-[11px] text-neutro-700">{usuario?.correo}</div>
          </div>
          <MenuUsuario
            lado="top"
            disparador={
              <button
                type="button"
                aria-label={TEXTOS_NAVEGACION.menuUsuario}
                className="grid size-[44px] cursor-pointer place-items-center rounded-md text-acento-700 hover:bg-acento/10"
              >
                <EllipsisVertical aria-hidden size={18} />
              </button>
            }
          />
        </div>
      </div>
    </aside>
  );
}
