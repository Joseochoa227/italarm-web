import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse } from "msw";

import { pagina, producto, reportePeriodo } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

const sinNbsp = (t: string | null) => (t ?? "").replace(/[\u00a0\u202f]/g, " ");
const usd = (monto: string) => ({ monto, moneda: "USD" as const });
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function servirPeriodo() {
  const consultas: URLSearchParams[] = [];
  servidor.use(
    http.get("/api/v1/reportes/periodo", ({ request, response }) => {
      const q = new URL(request.url).searchParams;
      consultas.push(q);
      if (q.get("fecha") === "2026-09-01") {
        return response(200).json(
          reportePeriodo({
            desde: "2026-09-01",
            hasta: "2026-09-30",
            anterior: { desde: "2026-08-01", hasta: "2026-08-31" },
            siguiente: { desde: "2026-10-01", hasta: "2026-10-31" },
          }),
        );
      }
      if (q.get("tipo") === "RANGO") {
        return response(200).json(
          reportePeriodo({
            tipo: "RANGO",
            desde: q.get("desde") ?? "2026-10-01",
            hasta: q.get("hasta") ?? "2026-10-31",
          }),
        );
      }
      return response(200).json(reportePeriodo());
    }),
  );
  return consultas;
}

function vigilarDescargas() {
  const nombres: string[] = [];
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:xlsx");
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    nombres.push(this.download);
  });
  return nombres;
}

const excel = (nombre: string) =>
  new HttpResponse("xlsx", {
    headers: { "Content-Type": XLSX, "Content-Disposition": `attachment; filename="${nombre}"` },
  });

describe("Reportes · Resumen (RF-135 a RF-140, RF-142)", () => {
  it("muestra el mes en curso con indicadores, gráfico, más vendidos, compras, cotizaciones y stock bajo", async () => {
    servirPeriodo();
    renderizarApp({ ruta: "/reportes" });

    expect(await screen.findByText("Del 01/10/2026 al 31/10/2026")).toBeVisible();
    expect(screen.getByRole("radio", { name: "Mes" })).toHaveAttribute("aria-checked", "true");
    expect(sinNbsp(screen.getByRole("group", { name: "Ventas de material" }).textContent)).toContain(
      "US$ 2.152,00",
    );
    expect(screen.getByRole("group", { name: "Inventario valorizado" })).toHaveTextContent(
      "Al día de hoy (06/10/2026)",
    );

    const grafico = screen.getByRole("list", { name: "Ventas e instalaciones (USD)" });
    const [primera] = within(grafico).getAllByRole("listitem");
    expect(sinNbsp(primera!.getAttribute("aria-label"))).toBe(
      "1–4 oct: ventas US$ 500,00, instalaciones US$ 1.000,00",
    );
    // La barra más alta del período llega al 100 %.
    const barras = grafico.querySelectorAll<HTMLElement>("li > span");
    expect([...barras].map((b) => b.style.height)).toEqual(["26.3%", "52.6%", "86.9%", "100%"]);
    const tabla = screen.getByRole("table", { name: "Ventas e instalaciones (USD)" });
    expect(sinNbsp(tabla.textContent)).toContain("5–11 oct18US$ 1.652,005US$ 1.901,00");

    const vendidos = screen.getByRole("list", { name: "Más vendidos" });
    expect(sinNbsp(vendidos.textContent)).toContain("Cable UTP850,5 m · US$ 425,25");
    expect(screen.getByRole("region", { name: "Más usados en instalaciones" })).toHaveTextContent(
      "Sin productos en este período.",
    );
    const compras = screen.getByRole("region", { name: "Compras por proveedor" });
    expect(sinNbsp(compras.textContent)).toContain("Distribuidora AndinaUS$ 3.000,00 · 3 compras");
    expect(sinNbsp(compras.textContent)).toContain("Total: US$ 3.750,00");
    const cotizaciones = screen.getByRole("region", { name: "Cotizaciones del período" });
    expect(sinNbsp(cotizaciones.textContent)).toContain("60 % aprobadas");
    expect(cotizaciones).toHaveTextContent("Convertida4");
    expect(screen.getByRole("region", { name: "Stock bajo" })).toHaveTextContent("Cable UTP50 m / mín. 200");
  });

  it("se mueve con las flechas, cambia a semana o año y acepta un rango libre (RF-135)", async () => {
    const consultas = servirPeriodo();
    const { usuario, router } = renderizarApp({ ruta: "/reportes" });

    await usuario.click(await screen.findByRole("button", { name: "Período anterior" }));
    expect(await screen.findByText("Del 01/09/2026 al 30/09/2026")).toBeVisible();
    expect(consultas.at(-1)?.get("fecha")).toBe("2026-09-01");
    expect(router.state.location.search).toContain("fecha=2026-09-01");

    await usuario.click(screen.getByRole("radio", { name: "Año" }));
    await waitFor(() => {
      expect(consultas.at(-1)?.get("tipo")).toBe("ANIO");
    });
    expect(consultas.at(-1)?.get("fecha")).toBeNull();

    await usuario.click(screen.getByRole("radio", { name: "Rango" }));
    expect(screen.queryByRole("button", { name: "Período anterior" })).not.toBeInTheDocument();
    await usuario.type(screen.getByLabelText("Desde"), "2026-08-15");
    await waitFor(() => {
      expect(consultas.at(-1)?.get("desde")).toBe("2026-08-15");
    });
    expect(consultas.at(-1)?.get("tipo")).toBe("RANGO");
  });

  it("sin movimiento lo dice; si falla, se puede reintentar", async () => {
    let fallar = true;
    servidor.use(
      http.get("/api/v1/reportes/periodo", ({ response }) =>
        fallar
          ? problema(500, "ERROR_INTERNO", "x")
          : response(200).json(
              reportePeriodo({
                serie: [],
                masVendidos: [],
                comprasPorProveedor: [],
                cotizaciones: { total: 0 },
              }),
            ),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/reportes" });

    const reintentar = await screen.findByRole("button", { name: "Reintentar" });
    fallar = false;
    await usuario.click(reintentar);
    expect(await screen.findByText("No hubo ventas ni instalaciones en este período.")).toBeVisible();
    expect(screen.getByText("No hubo compras en este período.")).toBeVisible();
    expect(screen.getByText("No hubo cotizaciones en este período.")).toBeVisible();
  });

  it("exporta el reporte del período a Excel con el mismo período (RF-144)", async () => {
    servirPeriodo();
    const nombres = vigilarDescargas();
    let consulta: URLSearchParams | undefined;
    servidor.use(
      http.get("/api/v1/reportes/periodo/excel", ({ request }) => {
        consulta = new URL(request.url).searchParams;
        return excel("reporte-2026-09.xlsx") as never;
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/reportes?fecha=2026-09-01" });

    await screen.findByText("Del 01/09/2026 al 30/09/2026");
    await usuario.click(screen.getByRole("button", { name: "Excel" }));
    await waitFor(() => {
      expect(nombres).toEqual(["reporte-2026-09.xlsx"]);
    });
    expect(consulta?.get("tipo")).toBe("MES");
    expect(consulta?.get("fecha")).toBe("2026-09-01");
  });
});

describe("Reportes · Utilidad por documento (RF-143, P-63)", () => {
  it("lista cobrado, costo, utilidad y margen con los totales; filtra por tipo y ordena por utilidad", async () => {
    servirPeriodo();
    const consultas: URLSearchParams[] = [];
    servidor.use(
      http.get("/api/v1/reportes/utilidad", ({ request, response }) => {
        consultas.push(new URL(request.url).searchParams);
        return response(200).json({
          desde: "2026-10-01",
          hasta: "2026-10-31",
          totalUsd: usd("5053.0000"),
          costoUsd: usd("3279.0000"),
          utilidadUsd: usd("1774.0000"),
          porcentajeUtilidad: "35.11",
          documentos: pagina([
            {
              tipo: "VENTA",
              id: 60,
              consecutivo: "V-0001",
              cliente: "Ferretería El Tornillo",
              fecha: "2026-10-06",
              total: { monto: "102000.0000", moneda: "COP" as const },
              costo: { monto: "70000.0000", moneda: "COP" as const },
              utilidad: { monto: "32000.0000", moneda: "COP" as const },
              utilidadUsd: usd("8.0000"),
              porcentajeUtilidad: "31.37",
            },
            {
              tipo: "INSTALACION",
              id: 80,
              consecutivo: "I-0001",
              cliente: "Ana Gómez",
              total: usd("65.5000"),
              costo: usd("17.5000"),
              utilidad: usd("48.0000"),
              utilidadUsd: usd("48.0000"),
              porcentajeUtilidad: "73.28",
            },
          ]),
        });
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/reportes?pestana=utilidad&periodo=ANIO" });

    const lista = await screen.findByRole("list", { name: "Utilidad por documento" });
    const [venta, instalacion] = within(lista).getAllByRole("listitem");
    expect(sinNbsp(venta!.textContent)).toContain("Cobrado $ 102.000");
    expect(sinNbsp(venta!.textContent)).toContain("$ 32.000 · 31,37 %US$ 8,00");
    expect(within(venta!).getByRole("link")).toHaveAttribute("href", "/ventas/60");
    expect(within(instalacion!).getByRole("link")).toHaveAttribute("href", "/instalaciones/80");
    expect(sinNbsp(screen.getByRole("region", { name: "Totales del período" }).textContent)).toContain(
      "UtilidadUS$ 1.774,00",
    );
    expect(consultas.at(-1)?.get("periodo")).toBe("ANIO");

    await usuario.selectOptions(screen.getByLabelText("Tipo"), "Instalaciones");
    await usuario.click(screen.getByLabelText("Ordenar por utilidad"));
    await waitFor(() => {
      expect(consultas.at(-1)?.get("ordenarPorUtilidad")).toBe("true");
    });
    expect(consultas.at(-1)?.get("tipo")).toBe("INSTALACION");
    // Cambiar de pestaña conserva el período.
    expect(screen.getByRole("link", { name: "Resumen" })).toHaveAttribute(
      "href",
      "/reportes?periodo=ANIO&pestana=resumen",
    );
  });
});

describe("Reportes · Seriales (RF-141)", () => {
  it("cuenta por estado, filtra por estado y producto y exporta con los mismos filtros", async () => {
    const consultas: URLSearchParams[] = [];
    let consultaExcel: URLSearchParams | undefined;
    const nombres = vigilarDescargas();
    servidor.use(
      http.get("/api/v1/productos", ({ response }) => response(200).json(pagina([producto()]))),
      http.get("/api/v1/reportes/seriales", ({ request, response }) => {
        consultas.push(new URL(request.url).searchParams);
        return response(200).json({
          porEstado: [
            { estado: "EN_BODEGA", cantidad: 12 },
            { estado: "VENDIDO", cantidad: 5 },
            { estado: "INSTALADO", cantidad: 8 },
          ],
          seriales: pagina([
            {
              id: 500,
              numero: "SN-0001",
              productoId: 10,
              codigoProducto: "CAM-D2",
              producto: "Cámara domo 2MP",
              estado: "VENDIDO",
              entrada: "C-0001",
              fechaEntrada: "2026-10-01",
              salida: "V-0001",
              vencimientoGarantia: "2027-01-06",
            },
          ]),
        });
      }),
      http.get("/api/v1/reportes/seriales/excel", ({ request }) => {
        consultaExcel = new URL(request.url).searchParams;
        return excel("seriales.xlsx") as never;
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/reportes?pestana=seriales" });

    expect(await screen.findByText("En bodega")).toBeVisible();
    expect(screen.queryByRole("radiogroup", { name: "Período" })).not.toBeInTheDocument();
    const lista = await screen.findByRole("list", { name: "Seriales" });
    expect(lista).toHaveTextContent("SN-0001");
    expect(lista).toHaveTextContent("Entró con C-0001 el 01/10/2026");
    expect(lista).toHaveTextContent("Garantía hasta 06/01/2027");
    expect(within(lista).getByRole("link")).toHaveAttribute("href", "/seriales/500");

    await usuario.selectOptions(screen.getByLabelText("Estado"), "Vendidos");
    await usuario.click(screen.getByRole("button", { name: "Producto" }));
    await usuario.click(await screen.findByRole("button", { name: /Cámara domo 2MP/ }));
    await waitFor(() => {
      expect(consultas.at(-1)?.get("productoId")).toBe("10");
    });
    expect(consultas.at(-1)?.get("estado")).toBe("VENDIDO");

    await usuario.click(screen.getByRole("button", { name: "Excel" }));
    await waitFor(() => {
      expect(nombres).toEqual(["seriales.xlsx"]);
    });
    expect(consultaExcel?.get("estado")).toBe("VENDIDO");
    expect(consultaExcel?.get("productoId")).toBe("10");
  });

  it("si el Excel pasa del límite, muestra el mensaje del backend (P-62)", async () => {
    servidor.use(
      http.get("/api/v1/reportes/seriales", ({ response }) =>
        response(200).json({ porEstado: [], seriales: pagina([]) }),
      ),
      http.get("/api/v1/reportes/seriales/excel", () =>
        problema(422, "EXPORTACION_MUY_GRANDE", "El archivo tendría más de 20.000 filas. Acota los filtros."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/reportes?pestana=seriales" });

    expect(await screen.findByText("No hay seriales con estos filtros.")).toBeVisible();
    await usuario.click(screen.getByRole("button", { name: "Excel" }));
    expect(
      await screen.findByText("El archivo tendría más de 20.000 filas. Acota los filtros."),
    ).toBeVisible();
  });
});
