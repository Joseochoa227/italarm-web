import { Plus } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router";

import { Dialogo } from "@/components/ui/Dialogo";
import { useSesion } from "@/features/auth/hooks/contextoSesion";
import { TasasBarra } from "@/features/tasas/components/RecuadroTasas";
import { cx } from "@/lib/clases";
import { inicial } from "@/lib/texto";

import { BotonBuscarSerial } from "./BotonBuscarSerial";
import { MenuUsuario } from "./MenuUsuario";
import {
  BARRA_INFERIOR_DERECHA,
  BARRA_INFERIOR_IZQUIERDA,
  MENU_NUEVO,
  type OpcionNavegacion,
  TEXTOS_NAVEGACION,
} from "./navegacion";

/** Barra superior del celular (RF-03): marca, tasas, búsqueda de seriales (W-06) y usuario. */
export function BarraSuperior() {
  const { usuario } = useSesion();
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-divisor bg-fondo px-4 py-2">
      <span className="flex-1 marca text-[22px]">ITALARM</span>
      <TasasBarra />
      <BotonBuscarSerial />
      <MenuUsuario
        disparador={
          <button
            type="button"
            aria-label={TEXTOS_NAVEGACION.menuUsuario}
            className="grid size-[44px] cursor-pointer place-items-center rounded-full border border-divisor bg-transparent font-titulo font-semibold"
          >
            {inicial(usuario?.nombre)}
          </button>
        }
      />
    </header>
  );
}

function Pestana({ ruta, etiqueta, icono: Icono }: OpcionNavegacion) {
  return (
    <NavLink
      to={ruta}
      end={ruta === "/"}
      className={({ isActive }) =>
        cx(
          "flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-md text-[11px] no-underline",
          isActive
            ? "font-semibold text-acento-700 hover:text-acento-700"
            : "text-neutro-700 hover:text-tinta",
        )
      }
    >
      <Icono aria-hidden size={22} />
      <span>{etiqueta}</span>
    </NavLink>
  );
}

/** Barra inferior del celular (RF-03) con el botón Nuevo (+) y su hoja de opciones (RF-04). */
export function BarraInferior() {
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const navegar = useNavigate();
  return (
    <>
      <nav
        aria-label={TEXTOS_NAVEGACION.menuPrincipal}
        className="sticky bottom-0 z-10 grid grid-cols-5 border-t border-divisor bg-fondo px-1 pt-1 pb-[calc(4px+env(safe-area-inset-bottom))]"
      >
        {BARRA_INFERIOR_IZQUIERDA.map((o) => (
          <Pestana key={o.ruta} {...o} />
        ))}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={hojaAbierta}
          onClick={() => {
            setHojaAbierta(true);
          }}
          className="flex min-h-[56px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md bg-acento-700 text-[11px] text-fondo"
        >
          <Plus aria-hidden size={22} />
          <span>{TEXTOS_NAVEGACION.nuevo}</span>
        </button>
        {BARRA_INFERIOR_DERECHA.map((o) => (
          <Pestana key={o.ruta} {...o} />
        ))}
      </nav>
      <Dialogo
        abierto={hojaAbierta}
        alCambiar={setHojaAbierta}
        titulo={TEXTOS_NAVEGACION.registrar}
        posicion="inferior"
      >
        <div className="flex flex-col gap-2">
          {MENU_NUEVO.map(({ ruta, etiqueta, icono: Icono }) => (
            <button
              key={ruta}
              type="button"
              onClick={() => {
                setHojaAbierta(false);
                void navegar(ruta);
              }}
              className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-md border border-divisor px-4 font-titulo text-[17px] font-semibold hover:bg-tinta/7"
            >
              <Icono aria-hidden size={20} />
              {etiqueta}
            </button>
          ))}
        </div>
      </Dialogo>
    </>
  );
}
