import { $api, api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { Pestanas } from "@/components/ui/Pestanas";
import { formatearFecha } from "@/lib/formato";
import { pestanaActiva } from "@/lib/pestanas";

import { BotonExcel } from "../components/BotonExcel";
import { ReporteSeriales } from "../components/ReporteSeriales";
import { ResumenPeriodo } from "../components/ResumenPeriodo";
import { SelectorPeriodo } from "../components/SelectorPeriodo";
import { UtilidadDocumentos } from "../components/UtilidadDocumentos";
import { filtrosSeriales, filtrosUtilidad } from "../hooks/filtros";
import { usePeriodo } from "../hooks/periodo";
import { TEXTOS_REPORTES } from "../textos";

const T = TEXTOS_REPORTES;
const PESTANAS = [
  { valor: "resumen", etiqueta: T.pestanas.resumen },
  { valor: "utilidad", etiqueta: T.pestanas.utilidad },
  { valor: "seriales", etiqueta: T.pestanas.seriales },
] as const;

/**
 * Reportes (sección 3.16, RF-135 a RF-144): período con flechas o rango, y las pestañas Resumen,
 * Utilidad por documento y Seriales, cada una con su botón Excel. Todo lo calcula el backend con
 * los valores en USD guardados en cada documento.
 */
export function Component() {
  const periodo = usePeriodo();
  const { filtros } = periodo;
  const pestana = pestanaActiva(filtros.leer("pestana"), PESTANAS);
  const conPeriodo = pestana !== "seriales";
  // El resumen también da los límites del período (anterior y siguiente) para las otras pestañas.
  const consulta = $api.useQuery(
    "get",
    "/api/v1/reportes/periodo",
    { params: { query: periodo.consulta } },
    { enabled: conPeriodo },
  );
  const reporte = consulta.data;
  const error = errorDeConsultas(consulta);

  const excel = {
    resumen: (
      <BotonExcel
        nombre="reporte"
        obtener={() =>
          api.GET("/api/v1/reportes/periodo/excel", { params: { query: periodo.consulta }, parseAs: "blob" })
        }
      />
    ),
    utilidad: (
      <BotonExcel
        nombre="utilidad"
        obtener={() =>
          api.GET("/api/v1/reportes/utilidad/excel", {
            params: { query: filtrosUtilidad(periodo) },
            parseAs: "blob",
          })
        }
      />
    ),
    seriales: (
      <BotonExcel
        nombre="seriales"
        obtener={() =>
          api.GET("/api/v1/reportes/seriales/excel", {
            params: { query: filtrosSeriales(filtros) },
            parseAs: "blob",
          })
        }
      />
    ),
  }[pestana];

  return (
    <>
      <EncabezadoPagina
        titulo={T.titulo}
        subtitulo={
          conPeriodo && reporte?.desde && reporte.hasta
            ? T.periodo.rango(formatearFecha(reporte.desde), formatearFecha(reporte.hasta))
            : undefined
        }
        acciones={excel}
      />
      <Pestanas
        etiqueta={T.titulo}
        activa={pestana}
        opciones={PESTANAS}
        ruta="/reportes"
        conservar={periodo.enUrl}
      />
      {conPeriodo && (
        <SelectorPeriodo periodo={periodo} anterior={reporte?.anterior} siguiente={reporte?.siguiente} />
      )}
      {pestana === "seriales" ? (
        <ReporteSeriales filtros={filtros} />
      ) : pestana === "utilidad" ? (
        <UtilidadDocumentos periodo={periodo} />
      ) : error ? (
        <EstadoError error={error} alReintentar={() => void consulta.refetch()} />
      ) : reporte ? (
        <ResumenPeriodo reporte={reporte} />
      ) : (
        <CargandoLista filas={4} />
      )}
    </>
  );
}
