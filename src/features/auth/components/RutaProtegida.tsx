import { Navigate, Outlet, useLocation } from "react-router";

import { EstadoError } from "@/components/ui/EstadoError";

import { useSesion } from "../hooks/contextoSesion";
import { rutaIngreso } from "../rutaVolver";

import { PantallaCargaSesion } from "./PantallaCargaSesion";

/** Sin sesión, cualquier ruta protegida lleva al ingreso y conserva a dónde se quería ir. */
export function RutaProtegida() {
  const { usuario, validando, error, reintentar } = useSesion();
  const ubicacion = useLocation();

  if (validando) return <PantallaCargaSesion />;
  if (error) {
    return (
      <main className="mx-auto grid min-h-dvh w-full max-w-[460px] place-items-center p-6">
        <EstadoError error={error} alReintentar={reintentar} />
      </main>
    );
  }
  if (!usuario) return <Navigate replace to={rutaIngreso(`${ubicacion.pathname}${ubicacion.search}`)} />;
  return <Outlet />;
}
