import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Campo, type PropiedadesCampo } from "./Campo";

/** Campo de contraseña con botón para mostrarla u ocultarla. */
export function CampoContrasena(propiedades: Omit<PropiedadesCampo, "type" | "adorno">) {
  const [visible, setVisible] = useState(false);
  return (
    <Campo
      {...propiedades}
      type={visible ? "text" : "password"}
      adorno={
        <button
          type="button"
          onClick={() => {
            setVisible((v) => !v);
          }}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="grid size-[44px] cursor-pointer place-items-center text-neutro-700 hover:text-tinta"
        >
          {visible ? <EyeOff aria-hidden size={16} /> : <Eye aria-hidden size={16} />}
        </button>
      }
    />
  );
}
