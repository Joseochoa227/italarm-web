import { render, screen } from "@testing-library/react";

import { configuracion, vistaPreviaCotizacion } from "@/test/datos";

import { VistaPreviaPdf } from "./components/VistaPreviaPdf";

const sinNbsp = (t: string | null) => (t ?? "").replace(/[\u00a0\u202f]/g, " ");
const montos = (usd: string, cop: string) => ({
  usd: { monto: usd, moneda: "USD" as const },
  cop: { monto: cop, moneda: "COP" as const },
});

describe("Vista previa del PDF de la cotización (RF-85, W-12)", () => {
  it("muestra la empresa, el consecutivo, el descuento y el total en las monedas del PDF", () => {
    const previa = vistaPreviaCotizacion(
      { tipo: "VENTA", moneda: "USD", lineas: [{ productoId: 11, cantidad: "20" }] },
      {
        resumen: {
          subtotal: montos("100.0000", "420000.0000"),
          descuento: montos("10.0000", "42000.0000"),
          total: montos("90.0000", "378000.0000"),
        },
        tasas: { tasaVes: "50" },
      },
    );
    render(
      <VistaPreviaPdf
        empresa={configuracion({
          empresaLema: "Seguridad electrónica",
          empresaNit: "900123456-7",
          empresaCiudad: "Cúcuta",
          logoUrl: "http://archivos.prueba/logo.png",
          piePdf: "Garantía según condiciones.",
        })}
        consecutivo="COT-0007 v2"
        cliente={{ nombre: "Ana Gómez", direccion: "Calle 10" }}
        descripcion="No se muestra en las de venta"
        previa={previa}
        moneda="USD"
        monedasComprobante={["USD", "COP"]}
      />,
    );

    const texto = sinNbsp(screen.getByRole("region", { name: "Vista previa del PDF" }).textContent);
    expect(texto).toContain("COT-0007 v2");
    expect(texto).toContain("Seguridad electrónica");
    expect(texto).toContain("NIT 900123456-7 · Cúcuta");
    expect(texto).toContain("Ana Gómez");
    expect(texto).toContain("Descuento− US$ 10,00");
    expect(texto).toContain("TotalUS$ 90,00$ 378.000");
    expect(texto).toContain("Tasas del día: Bs 50");
    expect(texto).toContain("Garantía según condiciones.");
    expect(texto).not.toContain("No se muestra en las de venta");
    expect(texto).not.toContain("Mano de obra");
  });

  it("sin vista previa todavía, invita a agregar ítems", () => {
    render(
      <VistaPreviaPdf
        empresa={undefined}
        consecutivo={undefined}
        cliente={null}
        descripcion=""
        previa={undefined}
        moneda="COP"
        monedasComprobante={[]}
      />,
    );
    expect(screen.getByText("COT-····")).toBeVisible();
    expect(screen.getByText("Los ítems aparecen aquí al agregarlos.")).toBeVisible();
  });
});
