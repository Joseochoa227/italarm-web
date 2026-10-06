import { useQueryClient } from "@tanstack/react-query";

import { comoFormulario } from "@/api/archivos";
import { api } from "@/api/cliente";
import { SelectorImagen } from "@/components/ui/SelectorImagen";
import { Tarjeta } from "@/components/ui/Tarjeta";

import { type Configuracion, CONSULTA_CONFIGURACION } from "../hooks/configuracion";
import { TEXTOS_CONFIGURACION } from "../textos";

/** Logo de la empresa para los PDF (RF-145, guía §6). */
export function LogoEmpresa({ url }: { url: string | undefined }) {
  const clienteConsultas = useQueryClient();
  const actualizar = (nueva: Configuracion | undefined) => {
    if (nueva) clienteConsultas.setQueryData(CONSULTA_CONFIGURACION.queryKey, nueva);
  };
  return (
    <Tarjeta>
      <SelectorImagen
        etiqueta={TEXTOS_CONFIGURACION.empresa.logo}
        uso="logo"
        url={url}
        alSubir={async (archivo) => {
          actualizar(
            (
              await api.PUT("/api/v1/configuracion/logo", {
                body: { archivo },
                bodySerializer: comoFormulario,
              })
            ).data,
          );
        }}
        alQuitar={async () => {
          actualizar((await api.DELETE("/api/v1/configuracion/logo")).data);
        }}
      />
    </Tarjeta>
  );
}
