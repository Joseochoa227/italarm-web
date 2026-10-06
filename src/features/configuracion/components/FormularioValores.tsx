import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { comoErrorApi } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EstadoError } from "@/components/ui/EstadoError";
import { Selector } from "@/components/ui/Selector";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { decimalAEdicion } from "@/lib/decimal";
import { aplicarErroresDeCampo, erroresDeCampo, esConflictoDeVersion, MENSAJES_ERROR } from "@/lib/errores";

import { type Configuracion, useGuardarConfiguracion } from "../hooks/configuracion";
import { esquemaValores } from "../schemas/esquemas";
import { TEXTOS_CONFIGURACION } from "../textos";

const T = TEXTOS_CONFIGURACION;
const CAMPOS = [
  "validezCotizacionDias",
  "garantiaManoObraMeses",
  "garantiaEquiposMeses",
  "limiteVariacionTasa",
  "condicionesGarantia",
  "piePdf",
] as const;
type Entrada = z.input<typeof esquemaValores>;

const DIAS = [8, 15, 30].map((n) => ({ valor: String(n), etiqueta: T.valores.dias(n) }));
const MESES = [1, 2, 3].map((n) => ({ valor: String(n), etiqueta: T.valores.meses(n) }));

function valoresDe(c: Configuracion): Entrada {
  const texto = <V extends string>(n: number | undefined, defecto: V) =>
    n === undefined ? defecto : (String(n) as V);
  return {
    validezCotizacionDias: texto<"8" | "15" | "30">(c.validezCotizacionDias, "15"),
    garantiaManoObraMeses: texto<"1" | "2" | "3">(c.garantiaManoObraMeses, "3"),
    garantiaEquiposMeses: texto<"1" | "2" | "3">(c.garantiaEquiposMeses, "3"),
    limiteVariacionTasa: decimalAEdicion(c.limiteVariacionTasa),
    condicionesGarantia: c.condicionesGarantia ?? "",
    piePdf: c.piePdf ?? "",
  };
}

/** Valores por defecto de los documentos y límite de variación de tasas (RF-146, RF-147). */
export function FormularioValores({
  configuracion,
  recargar,
}: {
  configuracion: Configuracion;
  recargar: () => Promise<unknown>;
}) {
  const avisar = useAvisar();
  const guardar = useGuardarConfiguracion();
  const [conflicto, setConflicto] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Entrada, unknown, z.output<typeof esquemaValores>>({
    resolver: zodResolver(esquemaValores),
    values: valoresDe(configuracion),
  });
  // Conflicto de versión: se recargan los datos actuales y se avisa (guía §5).
  const alFallar = async (e: unknown) => {
    if (esConflictoDeVersion(e)) {
      await recargar();
      setConflicto(true);
      return;
    }
    aplicarErroresDeCampo(comoErrorApi(e), setError, CAMPOS);
  };

  const error = guardar.error && !esConflictoDeVersion(guardar.error) ? comoErrorApi(guardar.error) : null;

  return (
    <Tarjeta>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((datos) => {
          setConflicto(false);
          guardar.mutate(
            { actual: configuracion, cambios: datos },
            {
              onSuccess: () => {
                avisar({ titulo: T.guardado });
              },
              onError: (e) => {
                void alFallar(e);
              },
            },
          );
        })}
      >
        {conflicto && (
          <Alerta tono="aviso" rol="alert">
            {MENSAJES_ERROR.conflicto}
          </Alerta>
        )}
        <div className="grid gap-4 escritorio:grid-cols-2">
          <Selector etiqueta={T.valores.validez} opciones={DIAS} {...register("validezCotizacionDias")} />
          <Campo
            etiqueta={T.valores.limite}
            inputMode="decimal"
            ayuda={T.valores.limiteAyuda}
            error={errors.limiteVariacionTasa?.message}
            {...register("limiteVariacionTasa")}
          />
          <Selector
            etiqueta={T.valores.garantiaManoObra}
            opciones={MESES}
            {...register("garantiaManoObraMeses")}
          />
          <Selector
            etiqueta={T.valores.garantiaEquipos}
            opciones={MESES}
            {...register("garantiaEquiposMeses")}
          />
        </div>
        <AreaTexto
          etiqueta={T.valores.condiciones}
          error={errors.condicionesGarantia?.message}
          {...register("condicionesGarantia")}
        />
        <AreaTexto etiqueta={T.valores.pie} error={errors.piePdf?.message} {...register("piePdf")} />
        {error && erroresDeCampo(error, CAMPOS).length === 0 && <EstadoError error={error} />}
        <Boton type="submit" variante="primario" ocupado={guardar.isPending} className="self-start">
          {T.guardar}
        </Boton>
      </form>
    </Tarjeta>
  );
}
