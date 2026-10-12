import type { components } from "@/api/esquema";
import type { Moneda } from "@/features/comercial/schemas/material";
import { compararDecimales } from "@/lib/decimal";
import {
  formatearCantidad,
  formatearDecimal,
  formatearDinero,
  formatearDineroDe,
  formatearFecha,
  separarMonedas,
} from "@/lib/formato";

import { TEXTOS_COTIZACIONES } from "../textos";

const P = TEXTOS_COTIZACIONES.pdf;
type Montos = components["schemas"]["MontoEnMonedas"] | undefined;
type Previa = components["schemas"]["VistaPreviaCotizacionVista"];
const CLAVE = { USD: "usd", COP: "cop", VES: "ves" } as const;

/** "Total en COP: $ 596.400 (TRM $ 4.200 del 06/10/2026)", como en el PDF (RF-130). */
function equivalentes(previa: Previa | undefined, moneda: Moneda, otras: readonly Moneda[]): string[] {
  const tasas = previa?.tasas;
  return otras
    .filter((m) => m !== moneda)
    .flatMap((destino) => {
      const total = previa?.resumen?.total?.[CLAVE[destino]];
      const conCop = moneda === "COP" || destino === "COP";
      const conVes = moneda === "VES" || destino === "VES";
      if (!total || (conCop && !tasas?.trm) || (conVes && !tasas?.tasaVes)) return [];
      const referencias = [
        conCop && tasas?.trm
          ? P.trm(formatearDinero(tasas.trm, "COP"), tasas.fechaTrm ? formatearFecha(tasas.fechaTrm) : "")
          : null,
        conVes && tasas?.tasaVes
          ? P.bolivar(
              formatearDinero(tasas.tasaVes, "VES"),
              tasas.fechaTasaVes ? formatearFecha(tasas.fechaTasaVes) : "",
            )
          : null,
      ].filter(Boolean);
      return [P.totalEn(destino, formatearDineroDe(total), referencias.join("; "))];
    });
}

function Total({ titulo, valor, fuerte = false }: { titulo: string; valor: string; fuerte?: boolean }) {
  return (
    <div className={fuerte ? "flex justify-between gap-3 font-semibold" : "flex justify-between gap-3"}>
      <span>{titulo}</span>
      <span>{valor}</span>
    </div>
  );
}

/**
 * Réplica en pantalla del PDF de la cotización (RF-85, W-12), armada con la vista previa del
 * backend y la Configuración en el mismo orden que `ComprobantesCotizacion` del backend: lo que verá
 * el cliente, sin costos ni utilidad. El PDF exacto se descarga después de guardar.
 */
export function VistaPreviaPdf({
  empresa,
  consecutivo,
  cliente,
  descripcion,
  observaciones,
  descuento,
  previa,
  moneda,
  monedasComprobante,
}: {
  empresa: components["schemas"]["ConfiguracionVista"] | undefined;
  consecutivo: string | undefined;
  cliente: { nombre?: string; documento?: string; telefono?: string; direccion?: string } | null;
  descripcion: string;
  observaciones: string;
  /** Tipo y valor escritos, para la etiqueta "Descuento (10 %)". */
  descuento: { tipo: string; valor: string };
  previa: Previa | undefined;
  moneda: Moneda;
  monedasComprobante: readonly Moneda[];
}) {
  const resumen = previa?.resumen;
  const en = (montos: Montos) => separarMonedas(montos, moneda).principal;
  const instalacion = previa?.tipo === "INSTALACION";
  const lineas = previa?.lineas ?? [];
  const manoDeObra = instalacion && compararDecimales(resumen?.manoDeObra?.usd?.monto ?? "0", "0") > 0;
  const conDescuento = compararDecimales(resumen?.descuento?.usd?.monto ?? "0", "0") > 0;
  const textoObservaciones = [
    instalacion && descripcion.trim() ? P.trabajo(descripcion.trim()) : null,
    observaciones.trim() || null,
  ].filter(Boolean);
  const garantia = instalacion
    ? P.garantiaInstalacion(empresa?.garantiaEquiposMeses ?? 3, empresa?.garantiaManoObraMeses ?? 3)
    : P.garantiaVenta(empresa?.garantiaEquiposMeses ?? 3);

  return (
    <section aria-label={P.titulo} className="flex flex-col gap-2">
      <h2 className="m-0 text-[22px]">{P.titulo}</h2>
      <article className="flex flex-col gap-4 rounded-sm border border-divisor bg-white p-6 text-[12px] leading-snug text-tinta shadow-md">
        <header className="flex items-start justify-between gap-4 border-b border-neutro-300 pb-3">
          <div className="flex items-start gap-3">
            {empresa?.logoUrl && <img src={empresa.logoUrl} alt="" className="h-12 w-auto object-contain" />}
            <div>
              <div className="text-[15px] font-semibold">{empresa?.empresaNombre}</div>
              {empresa?.empresaLema && <div className="text-neutro-600">{empresa.empresaLema}</div>}
              <div className="text-neutro-600">
                {[
                  empresa?.empresaNit && `NIT ${empresa.empresaNit}`,
                  empresa?.empresaCiudad,
                  empresa?.empresaTelefono,
                  empresa?.empresaCorreo,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[13px] font-semibold tracking-[0.06em] uppercase">
              {instalacion ? P.cotizacionInstalacion : P.cotizacion}
            </div>
            <div className="font-mono">{consecutivo ?? P.numero}</div>
            {previa?.fecha && <div>{P.fecha(formatearFecha(previa.fecha))}</div>}
            {previa?.vence && <div>{P.validaHasta(formatearFecha(previa.vence))}</div>}
          </div>
        </header>
        {cliente && (
          <div className="flex flex-col">
            <span>{P.cliente(cliente.nombre ?? "")}</span>
            {cliente.documento && <span>{P.documento(cliente.documento)}</span>}
            {cliente.direccion && <span>{P.direccion(cliente.direccion)}</span>}
            {cliente.telefono && <span>{P.telefono(cliente.telefono)}</span>}
          </div>
        )}
        {lineas.length === 0 && !manoDeObra ? (
          <p className="m-0 text-neutro-500">{P.sinItems}</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutro-300 text-left text-[10px] tracking-[0.08em] text-neutro-500 uppercase">
                <th className="py-1 font-normal">{P.columnas.descripcion}</th>
                <th className="py-1 text-right font-normal">{P.columnas.cantidad}</th>
                <th className="py-1 text-right font-normal">{P.columnas.precio}</th>
                <th className="py-1 text-right font-normal">{P.columnas.subtotal}</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((l) => (
                <tr key={l.productoId} className="border-b border-neutro-200 align-top">
                  <td className="py-1">{l.nombre}</td>
                  <td className="py-1 text-right whitespace-nowrap">
                    {l.cantidad ? formatearCantidad(l.cantidad) : ""} {l.abreviatura}
                  </td>
                  <td className="py-1 text-right whitespace-nowrap">
                    {l.precioUnitario ? formatearDineroDe(l.precioUnitario) : ""}
                  </td>
                  <td className="py-1 text-right whitespace-nowrap">{en(l.subtotal)}</td>
                </tr>
              ))}
              {manoDeObra && (
                <tr className="border-b border-neutro-200 align-top">
                  <td className="py-1">{P.manoDeObra}</td>
                  <td className="py-1 text-right">1</td>
                  <td className="py-1 text-right whitespace-nowrap">{en(resumen?.manoDeObra)}</td>
                  <td className="py-1 text-right whitespace-nowrap">{en(resumen?.manoDeObra)}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        <div className="ml-auto flex w-full max-w-[280px] flex-col gap-0.5">
          <Total titulo={P.subtotal} valor={en(resumen?.subtotal)} />
          {conDescuento && (
            <Total
              titulo={
                descuento.tipo === "PORCENTAJE" && descuento.valor.trim()
                  ? P.descuentoPorcentaje(formatearDecimal(descuento.valor.replace(",", ".")))
                  : P.descuento
              }
              valor={`-${en(resumen?.descuento)}`}
            />
          )}
          <Total titulo={P.total} valor={en(resumen?.total)} fuerte />
          {equivalentes(previa, moneda, monedasComprobante).map((t) => (
            <div key={t} className="text-right text-neutro-600">
              {t}
            </div>
          ))}
        </div>
        {textoObservaciones.length > 0 && (
          <p className="m-0 whitespace-pre-line">{P.observaciones(textoObservaciones.join("\n"))}</p>
        )}
        <footer className="flex flex-col gap-1 border-t border-neutro-300 pt-2 text-[10px] text-neutro-600">
          {previa?.vence && previa.validezDias !== undefined && (
            <span>{P.validez(previa.validezDias, formatearFecha(previa.vence))}</span>
          )}
          <span>{[garantia, empresa?.condicionesGarantia].filter(Boolean).join(" ")}</span>
          {empresa?.piePdf && <span className="whitespace-pre-line">{empresa.piePdf}</span>}
        </footer>
      </article>
      <p className="m-0 text-xs text-neutro-700">{P.nota}</p>
    </section>
  );
}
