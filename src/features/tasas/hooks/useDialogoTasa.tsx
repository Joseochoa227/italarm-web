import { useState } from "react";

import { sinIndefinidos } from "@/lib/objetos";

import { DialogoTasa, type ModoTasa } from "../components/DialogoTasa";

import type { Tasa, TasaVigente } from "./consultasTasas";

/** La tasa vigente como tasa a corregir (tiene id, par, fecha y valor). */
export function comoTasa(vigente: TasaVigente | undefined): Tasa | null {
  if (!vigente?.id) return null;
  return sinIndefinidos({ id: vigente.id, par: vigente.par, fecha: vigente.fecha, valor: vigente.valor });
}

/**
 * Estado del diálogo de tasas para una pantalla: `abrir(modo)` lo muestra y `dialogo` es el elemento
 * a dibujar. Si al registrar ya hay tasa de hoy, ofrece corregirla.
 */
export function useDialogoTasa(bolivarHoy: TasaVigente | undefined) {
  const [modo, setModo] = useState<ModoTasa | null>(null);
  const tasaHoy = bolivarHoy?.esDeHoy ? comoTasa(bolivarHoy) : null;
  const dialogo = modo && (
    <DialogoTasa
      // Al pasar de registrar a corregir, el diálogo empieza de cero.
      key={modo.tipo === "CORREGIR" ? `c-${modo.tasa.id ?? ""}` : modo.tipo}
      modo={modo}
      alCerrar={() => {
        setModo(null);
      }}
      {...(tasaHoy
        ? {
            alCorregirHoy: () => {
              setModo({ tipo: "CORREGIR", tasa: tasaHoy });
            },
          }
        : {})}
    />
  );
  return { abrir: setModo, dialogo };
}
