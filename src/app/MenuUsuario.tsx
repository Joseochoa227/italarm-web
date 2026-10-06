import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";

import { EncabezadoMenu, Menu, OpcionMenu, SeparadorMenu } from "@/components/ui/Menu";
import { useSesion } from "@/features/auth/hooks/contextoSesion";

import { MENU_USUARIO, TEXTOS_NAVEGACION } from "./navegacion";

/** Menú de la cuenta: Configuración, Usuarios, Cambiar contraseña y Cerrar sesión. */
export function MenuUsuario({ disparador, lado }: { disparador: ReactNode; lado?: "top" | "bottom" }) {
  const { usuario, cerrar } = useSesion();
  const navegar = useNavigate();
  return (
    <Menu disparador={disparador} {...(lado ? { lado } : {})}>
      <EncabezadoMenu>
        <span className="block font-medium">{usuario?.nombre}</span>
        <span className="block text-xs text-neutro-700">{usuario?.correo}</span>
      </EncabezadoMenu>
      <SeparadorMenu />
      {MENU_USUARIO.map(({ ruta, etiqueta, icono: Icono }) => (
        <OpcionMenu key={ruta} icono={<Icono aria-hidden size={16} />} alElegir={() => void navegar(ruta)}>
          {etiqueta}
        </OpcionMenu>
      ))}
      <SeparadorMenu />
      <OpcionMenu icono={<LogOut aria-hidden size={16} />} alElegir={() => void cerrar()}>
        {TEXTOS_NAVEGACION.cerrarSesion}
      </OpcionMenu>
    </Menu>
  );
}
