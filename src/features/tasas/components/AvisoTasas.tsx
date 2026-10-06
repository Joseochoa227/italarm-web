import { useLocation } from "react-router";

import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";

import { useTasasVigentes } from "../hooks/consultasTasas";
import { useDialogoTasa } from "../hooks/useDialogoTasa";
import { useReintentarTrm } from "../hooks/useReintentarTrm";
import { TEXTOS_TASAS } from "../textos";

/**
 * Aviso destacado cuando falta la tasa de hoy (RF-07, RF-33). Por W-05 aparece en todas las
 * pantallas menos en la de tasas, que ya muestra el estado de cada una.
 */
export function AvisoTasas() {
  const { pathname } = useLocation();
  const { data } = useTasasVigentes();
  const { abrir, dialogo } = useDialogoTasa(data?.bolivar);
  const reintentar = useReintentarTrm();

  if (pathname === "/tasas" || !data) return null;
  const avisos = [
    data.bolivar?.aviso && {
      clave: "ves",
      texto: data.bolivar.aviso,
      acciones: (
        <Boton
          variante="primario"
          onClick={() => {
            abrir({ tipo: "VES" });
          }}
        >
          {TEXTOS_TASAS.registrarVes}
        </Boton>
      ),
    },
    data.trm?.aviso && {
      clave: "trm",
      texto: data.trm.aviso,
      acciones: (
        <>
          <Boton
            ocupado={reintentar.isPending}
            onClick={() => {
              reintentar.mutate();
            }}
          >
            {TEXTOS_TASAS.reintentarTrm}
          </Boton>
          {data.trmAutomaticaFallo && (
            <Boton
              variante="primario"
              onClick={() => {
                abrir({ tipo: "TRM" });
              }}
            >
              {TEXTOS_TASAS.ingresarTrm}
            </Boton>
          )}
        </>
      ),
    },
  ].filter((a) => !!a);

  if (avisos.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {avisos.map((a) => (
        <Alerta
          key={a.clave}
          tono="aviso"
          rol="status"
          accion={<div className="flex flex-wrap gap-2">{a.acciones}</div>}
        >
          {a.texto}
        </Alerta>
      ))}
      {dialogo}
    </div>
  );
}
