import { useSesion } from "@/features/auth/hooks/contextoSesion";
import { formatearFechaLarga } from "@/lib/formato";

/** Inicio de la Fase 0: saludo con el nombre y la fecha (RF-06). Los bloques llegan en la Fase 6. */
export function Component() {
  const { usuario } = useSesion();
  const nombre = usuario?.nombre?.split(" ")[0] ?? "";
  return (
    <div>
      <p className="m-0 rotulo text-acento-700">{formatearFechaLarga(new Date())}</p>
      <h1 className="m-0 text-[32px] escritorio:text-[40px]">Hola, {nombre}</h1>
    </div>
  );
}
