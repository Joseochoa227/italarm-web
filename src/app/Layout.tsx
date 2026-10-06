import { Suspense } from "react";
import { Outlet } from "react-router";

import { Esqueleto } from "@/components/ui/Esqueleto";
import { useEsEscritorio } from "@/lib/medios";

import { AvisoSinConexion } from "./AvisoSinConexion";
import { BarraInferior, BarraSuperior } from "./BarrasCelular";
import { MenuLateral } from "./MenuLateral";

function CargandoPagina() {
  return (
    <div role="status" aria-label="Cargando" className="flex flex-col gap-4">
      <Esqueleto className="h-10 w-64" />
      <Esqueleto className="h-40 w-full" />
    </div>
  );
}

/** Layout principal (BF-08): menú lateral en computador; barras superior e inferior en celular. */
export function Layout() {
  const escritorio = useEsEscritorio();
  return (
    <div className="flex min-h-dvh">
      {escritorio && <MenuLateral />}
      <div className="flex min-w-0 flex-1 flex-col">
        {!escritorio && <BarraSuperior />}
        <AvisoSinConexion />
        <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-6 escritorio:px-10 escritorio:py-8">
          <Suspense fallback={<CargandoPagina />}>
            <Outlet />
          </Suspense>
        </main>
        {!escritorio && <BarraInferior />}
      </div>
    </div>
  );
}
