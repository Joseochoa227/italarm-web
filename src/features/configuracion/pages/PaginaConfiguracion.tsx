import { useSearchParams } from "react-router";

import { errorDeConsultas } from "@/api/problema";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { Pestanas } from "@/components/ui/Pestanas";
import { pestanaActiva } from "@/lib/pestanas";

import { FormularioEmpresa } from "../components/FormularioEmpresa";
import { FormularioValores } from "../components/FormularioValores";
import { GestionCategorias } from "../components/GestionCategorias";
import { GestionUnidades } from "../components/GestionUnidades";
import { useConfiguracion } from "../hooks/configuracion";
import { TEXTOS_CONFIGURACION } from "../textos";

const T = TEXTOS_CONFIGURACION;
const PESTANAS = [
  { valor: "empresa", etiqueta: T.pestanas.empresa },
  { valor: "valores", etiqueta: T.pestanas.valores },
  { valor: "categorias", etiqueta: T.pestanas.categorias },
  { valor: "unidades", etiqueta: T.pestanas.unidades },
] as const;

/** Configuración (3.17): empresa, valores por defecto, categorías y unidades (RF-145 a RF-148). */
export function Component() {
  const [parametros] = useSearchParams();
  const activa = pestanaActiva(parametros.get("pestana"), PESTANAS);
  const configuracion = useConfiguracion();
  const error = errorDeConsultas(configuracion);
  const recargar = () => configuracion.refetch();

  let contenido;
  if (activa === "categorias") contenido = <GestionCategorias />;
  else if (activa === "unidades") contenido = <GestionUnidades />;
  else if (error) contenido = <EstadoError error={error} alReintentar={() => void recargar()} />;
  else if (!configuracion.data) contenido = <CargandoLista filas={3} />;
  else if (activa === "empresa")
    contenido = <FormularioEmpresa configuracion={configuracion.data} recargar={recargar} />;
  else contenido = <FormularioValores configuracion={configuracion.data} recargar={recargar} />;

  return (
    <>
      <EncabezadoPagina titulo={T.titulo} subtitulo={T.subtitulo} />
      <Pestanas etiqueta={T.titulo} activa={activa} opciones={PESTANAS} ruta="/configuracion" />
      {contenido}
    </>
  );
}
