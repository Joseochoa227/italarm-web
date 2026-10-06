import { Compass } from "lucide-react";
import { Link } from "react-router";

import { EstadoVacio } from "@/components/ui/EstadoVacio";

export function Component() {
  return (
    <EstadoVacio icono={<Compass aria-hidden size={28} />} titulo="No encontramos esta página">
      Revisa la dirección o vuelve a <Link to="/">Inicio</Link>.
    </EstadoVacio>
  );
}
