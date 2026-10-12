import type { components } from "@/api/esquema";
import type { Moneda } from "@/features/comercial/schemas/material";
import { compararDecimales } from "@/lib/decimal";
import {
  formatearCantidad,
  formatearDecimal,
  formatearDineroDe,
  formatearFecha,
  separarMonedas,
} from "@/lib/formato";

import { TEXTOS_COTIZACIONES } from "../textos";

const P = TEXTOS_COTIZACIONES.pdf;
type Montos = components["schemas"]["MontoEnMonedas"] | undefined;

/** El total en la moneda de la cotización y, debajo, en las monedas elegidas para el PDF (P-34). */
function totalEn(montos: Montos, moneda: Moneda, otras: readonly Moneda[]) {
  const principal = separarMonedas(montos, moneda).principal;
  const adicionales = otras
    .filter((m) => m !== moneda)
    .map((m) => separarMonedas(montos, m).principal)
    .filter((t) => t !== "—");
  return { principal, adicionales };
}

function Fila({ titulo, valor, fuerte = false }: { titulo: string; valor: string; fuerte?: boolean }) {
  return (
    <div className={fuerte ? "flex justify-between gap-3 font-semibold" : "flex justify-between gap-3"}>
      <span>{titulo}</span>
      <span>{valor}</span>
    </div>
  );
}

/**
 * Réplica en pantalla del PDF de la cotización (RF-85, W-12), armada con la vista previa del
 * backend y los datos de la empresa: lo mismo que verá el cliente, sin costos ni utilidad.
 */
export function VistaPreviaPdf({
  empresa,
  consecutivo,
  cliente,
  descripcion,
  previa,
  moneda,
  monedasComprobante,
}: {
  empresa: components["schemas"]["ConfiguracionVista"] | undefined;
  consecutivo: string | undefined;
  cliente: {
    nombre?: string;
    documento?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
  } | null;
  descripcion: string;
  previa: components["schemas"]["VistaPreviaCotizacionVista"] | undefined;
  moneda: Moneda;
  monedasComprobante: readonly Moneda[];
}) {
  const resumen = previa?.resumen;
  const en = (montos: Montos) => separarMonedas(montos, moneda).principal;
  const total = totalEn(resumen?.total, moneda, monedasComprobante);
  const lineas = previa?.lineas ?? [];
  const conManoDeObra = previa?.tipo === "INSTALACION" && resumen?.manoDeObra;
  const conDescuento = compararDecimales(resumen?.descuento?.usd?.monto ?? "0", "0") > 0;
  const tasas = previa?.tasas;
  const textoTasas = [
    tasas?.trm ? `TRM ${formatearDecimal(tasas.trm)}` : null,
    tasas?.tasaVes ? `Bs ${formatearDecimal(tasas.tasaVes)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

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
            <div className="text-[14px] font-semibold tracking-[0.08em]">{P.cotizacion}</div>
            <div className="font-mono">{consecutivo ?? P.numero}</div>
            {previa?.fecha && (
              <div>
                {P.fecha}: {formatearFecha(previa.fecha)}
              </div>
            )}
            {previa?.vence && (
              <div>
                {P.validaHasta}: {formatearFecha(previa.vence)}
              </div>
            )}
          </div>
        </header>
        {cliente && (
          <div>
            <div className="text-[10px] tracking-[0.08em] text-neutro-500 uppercase">{P.cliente}</div>
            <div className="font-semibold">{cliente.nombre}</div>
            <div className="text-neutro-600">
              {[cliente.documento, cliente.telefono, cliente.direccion, cliente.ciudad]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
        )}
        {descripcion.trim() && previa?.tipo === "INSTALACION" && (
          <div>
            <div className="text-[10px] tracking-[0.08em] text-neutro-500 uppercase">{P.descripcion}</div>
            <p className="m-0 whitespace-pre-line">{descripcion.trim()}</p>
          </div>
        )}
        {lineas.length === 0 ? (
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
            </tbody>
          </table>
        )}
        <div className="ml-auto flex w-full max-w-[260px] flex-col gap-0.5">
          {conManoDeObra && (
            <>
              <Fila titulo={P.material} valor={en(resumen.material)} />
              <Fila titulo={P.manoDeObra} valor={en(resumen.manoDeObra)} />
            </>
          )}
          <Fila titulo={P.subtotal} valor={en(resumen?.subtotal)} />
          {conDescuento && <Fila titulo={P.descuento} valor={`− ${en(resumen?.descuento)}`} />}
          <Fila titulo={P.total} valor={total.principal} fuerte />
          {total.adicionales.map((t) => (
            <div key={t} className="text-right text-neutro-600">
              {t}
            </div>
          ))}
        </div>
        <footer className="flex flex-col gap-1 border-t border-neutro-300 pt-2 text-[10px] text-neutro-600">
          {textoTasas && <span>{P.tasas(textoTasas)}</span>}
          {empresa?.piePdf && <span className="whitespace-pre-line">{empresa.piePdf}</span>}
          <span>{P.pie}</span>
        </footer>
      </article>
      <p className="m-0 text-xs text-neutro-700">{P.nota}</p>
    </section>
  );
}
