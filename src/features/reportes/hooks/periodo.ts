import { useFiltrosUrl } from "@/lib/filtrosUrl";

export const TIPOS_PERIODO = ["SEMANA", "MES", "ANIO", "RANGO"] as const;
export type TipoPeriodo = (typeof TIPOS_PERIODO)[number];

/**
 * Período de los reportes guardado en la URL (RF-135, P-60): `periodo` (Mes por defecto), `fecha`
 * para moverse con las flechas, o `desde`–`hasta` en un rango libre. El botón Atrás lo conserva.
 */
export function usePeriodo() {
  const filtros = useFiltrosUrl();
  const leido = filtros.leer("periodo");
  const tipo: TipoPeriodo = TIPOS_PERIODO.find((t) => t === leido) ?? "MES";
  const fecha = filtros.leer("fecha");
  const desde = filtros.leer("desde");
  const hasta = filtros.leer("hasta");
  const rango = tipo === "RANGO";
  const consulta = rango
    ? { tipo, ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) }
    : { tipo, ...(fecha ? { fecha } : {}) };
  // Los parámetros del período que se conservan al cambiar de pestaña.
  const enUrl = new URLSearchParams(
    Object.entries({ periodo: leido, fecha, desde, hasta }).filter(([, v]) => v !== ""),
  ).toString();
  return {
    filtros,
    tipo,
    rango,
    desde,
    hasta,
    consulta,
    enUrl,
    cambiarTipo: (nuevo: TipoPeriodo) => {
      filtros.cambiar({ periodo: nuevo === "MES" ? "" : nuevo, fecha: "" });
    },
    irA: (nuevaFecha: string) => {
      filtros.cambiar({ fecha: nuevaFecha });
    },
    cambiarRango: (cambios: { desde?: string; hasta?: string }) => {
      filtros.cambiar(cambios);
    },
  };
}
