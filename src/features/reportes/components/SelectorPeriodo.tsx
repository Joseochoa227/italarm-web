import { ChevronLeft, ChevronRight } from "lucide-react";

import type { components } from "@/api/esquema";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Segmentado } from "@/components/ui/Segmentado";

import { type TipoPeriodo, TIPOS_PERIODO, type usePeriodo } from "../hooks/periodo";
import { TEXTOS_REPORTES } from "../textos";

const P = TEXTOS_REPORTES.periodo;
const OPCIONES = TIPOS_PERIODO.map((t) => ({ valor: t, etiqueta: P.tipos[t] }));
type Limite = components["schemas"]["ReportePeriodoVistaPeriodoVista"] | undefined;

/**
 * Selector de período (RF-135): Semana, Mes, Año o Rango; flechas al período anterior y al
 * siguiente que da el backend; en un rango, las fechas desde y hasta.
 */
export function SelectorPeriodo({
  periodo,
  anterior,
  siguiente,
}: {
  periodo: ReturnType<typeof usePeriodo>;
  anterior: Limite;
  siguiente: Limite;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Segmentado<TipoPeriodo>
        etiqueta={P.etiqueta}
        valor={periodo.tipo}
        opciones={OPCIONES}
        alCambiar={periodo.cambiarTipo}
      />
      {periodo.rango ? (
        <>
          <Campo
            etiqueta={P.desde}
            type="date"
            value={periodo.desde}
            onChange={(e) => {
              periodo.cambiarRango({ desde: e.target.value });
            }}
            className="w-[160px]"
          />
          <Campo
            etiqueta={P.hasta}
            type="date"
            value={periodo.hasta}
            onChange={(e) => {
              periodo.cambiarRango({ hasta: e.target.value });
            }}
            className="w-[160px]"
          />
        </>
      ) : (
        <div className="flex gap-1">
          <Boton
            variante="secundario"
            icono
            aria-label={P.anterior}
            disabled={!anterior?.desde}
            onClick={() => {
              if (anterior?.desde) periodo.irA(anterior.desde);
            }}
          >
            <ChevronLeft aria-hidden size={18} />
          </Boton>
          <Boton
            variante="secundario"
            icono
            aria-label={P.siguiente}
            disabled={!siguiente?.desde}
            onClick={() => {
              if (siguiente?.desde) periodo.irA(siguiente.desde);
            }}
          >
            <ChevronRight aria-hidden size={18} />
          </Boton>
        </div>
      )}
    </div>
  );
}
