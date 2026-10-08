import { useState } from "react";
import { useSearchParams } from "react-router";

import { errorDeConsultas } from "@/api/problema";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoError } from "@/components/ui/EstadoError";
import { Pestanas } from "@/components/ui/Pestanas";
import { pestanaActiva } from "@/lib/pestanas";

import { CargaInicial } from "../components/CargaInicial";
import { FormularioEmpresa } from "../components/FormularioEmpresa";
import { FormularioValores } from "../components/FormularioValores";
import { GestionCategorias } from "../components/GestionCategorias";
import { GestionUnidades } from "../components/GestionUnidades";
import { LogoEmpresa } from "../components/LogoEmpresa";
import { useConfiguracion } from "../hooks/configuracion";
import { TEXTOS_CONFIGURACION } from "../textos";

const T = TEXTOS_CONFIGURACION;
const PESTANAS = [
  { valor: "empresa", etiqueta: T.pestanas.empresa },
  { valor: "valores", etiqueta: T.pestanas.valores },
  { valor: "categorias", etiqueta: T.pestanas.categorias },
  { valor: "unidades", etiqueta: T.pestanas.unidades },
  { valor: "carga", etiqueta: T.pestanas.carga },
] as const;

/** Configuración (3.17): empresa, valores por defecto, categorías, unidades (RF-145 a RF-148) y carga inicial (3.18). */
export function Component() {
  const [parametros] = useSearchParams();
  const activa = pestanaActiva(parametros.get("pestana"), PESTANAS);
  const configuracion = useConfiguracion();
  const error = errorDeConsultas(configuracion);
  const recargar = () => configuracion.refetch();
  const [conflicto, setConflicto] = useState(false);
  const datos = configuracion.data;
  // Al guardar o recargar cambia la versión y el formulario se vuelve a montar con los datos actuales.
  const formulario = { recargar, conflicto, setConflicto };

  let contenido;
  if (activa === "categorias") contenido = <GestionCategorias />;
  else if (activa === "unidades") contenido = <GestionUnidades />;
  else if (activa === "carga") contenido = <CargaInicial />;
  else if (error) contenido = <EstadoError error={error} alReintentar={() => void recargar()} />;
  else if (!datos) contenido = <CargandoLista filas={3} />;
  else if (activa === "empresa")
    contenido = (
      <>
        <FormularioEmpresa key={datos.version} {...formulario} configuracion={datos} />
        <LogoEmpresa url={datos.logoUrl} />
      </>
    );
  else contenido = <FormularioValores key={datos.version} {...formulario} configuracion={datos} />;

  return (
    <>
      <EncabezadoPagina titulo={T.titulo} subtitulo={T.subtitulo} />
      <Pestanas etiqueta={T.titulo} activa={activa} opciones={PESTANAS} ruta="/configuracion" />
      {contenido}
    </>
  );
}
