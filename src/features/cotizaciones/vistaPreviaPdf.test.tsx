import { render, screen } from "@testing-library/react";

import { configuracion, vistaPreviaCotizacion } from "@/test/datos";

import { VistaPreviaPdf } from "./components/VistaPreviaPdf";

const sinNbsp = (t: string | null) => (t ?? "").replace(/[\u00a0\u202f]/g, " ");
const montos = (usd: string, cop: string) => ({
  usd: { monto: usd, moneda: "USD" as const },
  cop: { monto: cop, moneda: "COP" as const },
});

describe("Vista previa del PDF de la cotización (RF-85, W-12)", () => {
  it("sigue el PDF del backend: ítems con la mano de obra, descuento, equivalentes, validez y garantía", () => {
    const previa = vistaPreviaCotizacion(
      { tipo: "INSTALACION", moneda: "USD", lineas: [{ productoId: 11, cantidad: "20" }] },
      {
        resumen: {
          manoDeObra: montos("40.0000", "168000.0000"),
          subtotal: montos("100.0000", "420000.0000"),
          descuento: montos("10.0000", "42000.0000"),
          total: montos("90.0000", "378000.0000"),
        },
      },
    );
    render(
      <VistaPreviaPdf
        empresa={configuracion({
          empresaLema: "Seguridad electrónica",
          empresaNit: "900123456-7",
          empresaCiudad: "Cúcuta",
          logoUrl: "http://archivos.prueba/logo.png",
          garantiaEquiposMeses: 3,
          garantiaManoObraMeses: 2,
          condicionesGarantia: "No cubre humedad.",
          piePdf: "Pago de contado. Documento no válido como factura.",
        })}
        consecutivo="COT-0007 v2"
        cliente={{ nombre: "Ana Gómez", documento: "CC 123", direccion: "Calle 10", telefono: "+57300" }}
        descripcion="Dos cámaras"
        observaciones="Incluye configuración"
        descuento={{ tipo: "PORCENTAJE", valor: "10" }}
        previa={previa}
        moneda="USD"
        monedasComprobante={["USD", "COP", "VES"]}
      />,
    );

    const texto = sinNbsp(screen.getByRole("region", { name: "Vista previa del PDF" }).textContent);
    expect(texto).toContain("Cotización de instalaciónCOT-0007 v2Fecha: 06/10/2026Válida hasta: 21/10/2026");
    expect(texto).toContain("NIT 900123456-7 · Cúcuta");
    expect(texto).toContain("Cliente: Ana GómezDocumento: CC 123Dirección: Calle 10Teléfono: +57300");
    expect(texto).toContain("Cable UTP20 mUS$ 25,50");
    expect(texto).toContain("Mano de obra · instalación y configuración1US$ 40,00US$ 40,00");
    expect(texto).toContain("Descuento (10 %)-US$ 10,00");
    expect(texto).toContain("Total de contadoUS$ 90,00");
    expect(texto).toContain("Total en COP: $ 378.000 (TRM $ 4.200 del 06/10/2026)");
    // Sin el monto en bolívares de la vista previa, no se muestra ese equivalente.
    expect(texto).not.toContain("Total en VES");
    expect(texto).toContain("Observaciones: Trabajo a realizar: Dos cámaras\nIncluye configuración");
    expect(texto).toContain("Cotización válida por 15 días, hasta el 21/10/2026.");
    expect(texto).toContain(
      "Garantía de 3 meses en los equipos con serial y de 2 meses en la mano de obra. No cubre humedad.",
    );
    expect(texto).toContain("Pago de contado. Documento no válido como factura.");
    expect(texto).not.toContain("Costo");
  });

  it("en una de venta: sin mano de obra ni descripción, y garantía solo de equipos", () => {
    render(
      <VistaPreviaPdf
        empresa={configuracion({ garantiaEquiposMeses: 6 })}
        consecutivo={undefined}
        cliente={{ nombre: "Ana Gómez" }}
        descripcion="No se muestra"
        observaciones=""
        descuento={{ tipo: "VALOR", valor: "5" }}
        previa={vistaPreviaCotizacion(
          { tipo: "VENTA", moneda: "COP", lineas: [{ productoId: 10, cantidad: "1" }] },
          { tasas: { tasaVes: "50" } },
        )}
        moneda="COP"
        monedasComprobante={["USD"]}
      />,
    );
    const texto = sinNbsp(screen.getByRole("region", { name: "Vista previa del PDF" }).textContent);
    expect(texto).toContain("CotizaciónCOT-····");
    expect(texto).toContain("Garantía de 6 meses en los equipos con serial.");
    expect(texto).not.toContain("Mano de obra");
    expect(texto).not.toContain("No se muestra");
    // Sin TRM no se puede mostrar el total en dólares de una cotización en pesos.
    expect(texto).not.toContain("Total en USD");
  });

  it("sin vista previa todavía, invita a agregar ítems", () => {
    render(
      <VistaPreviaPdf
        empresa={undefined}
        consecutivo={undefined}
        cliente={null}
        descripcion=""
        observaciones=""
        descuento={{ tipo: "NINGUNO", valor: "" }}
        previa={undefined}
        moneda="COP"
        monedasComprobante={[]}
      />,
    );
    expect(screen.getByText("COT-····")).toBeVisible();
    expect(screen.getByText("Los ítems aparecen aquí al agregarlos.")).toBeVisible();
  });
});
