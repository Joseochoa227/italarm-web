import { useSearchParams } from "react-router";

import { AvisoFase } from "@/components/PaginaPendiente";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Pestanas } from "@/components/ui/Pestanas";
import { pestanaActiva } from "@/lib/pestanas";

import { ListaProveedores } from "../components/ListaProveedores";
import { TEXTOS_COMPRAS } from "../textos";

const T = TEXTOS_COMPRAS;
const PESTANAS = [
  { valor: "compras", etiqueta: T.pestanas.compras },
  { valor: "proveedores", etiqueta: T.pestanas.proveedores },
] as const;

/** Compras (3.6): en esta fase, la pestaña de proveedores (W-01, RF-37). Las compras llegan en la Fase 2. */
export function Component() {
  const [parametros] = useSearchParams();
  const activa = pestanaActiva(parametros.get("pestana"), PESTANAS);
  return (
    <>
      <EncabezadoPagina titulo={T.titulo} />
      <Pestanas etiqueta={T.titulo} activa={activa} opciones={PESTANAS} ruta="/compras" />
      {activa === "compras" ? <AvisoFase fase={2} /> : <ListaProveedores />}
    </>
  );
}
