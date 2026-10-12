import { screen, waitFor, within } from "@testing-library/react";

import { inicio, inicioVacio } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

const sinNbsp = (t: string | null) => (t ?? "").replace(/[\u00a0\u202f]/g, " ");

function servirInicio(...respuestas: ReturnType<typeof inicio>[]) {
  let i = 0;
  servidor.use(
    http.get("/api/v1/inicio", ({ response }) =>
      response(200).json(respuestas[Math.min(i++, respuestas.length - 1)]!),
    ),
  );
}

describe("Inicio (RF-06 a RF-13)", () => {
  it("muestra el aviso de tasas antes que todo, con el botón para registrarla (RF-07)", async () => {
    servirInicio(
      inicio({
        avisosTasas: [
          {
            par: "USD_VES",
            mensaje: "No se ha registrado la tasa del bolívar de hoy. Se está usando la del día anterior.",
          },
        ],
      }),
    );
    renderizarApp({ ruta: "/" });

    const aviso = await screen.findByRole("alert");
    expect(aviso).toHaveTextContent("No se ha registrado la tasa del bolívar de hoy.");
    expect(within(aviso).getByRole("link", { name: "Registrar tasa" })).toHaveAttribute("href", "/tasas");
    const principal = screen.getByRole("main");
    // El aviso va antes que el saludo.
    expect(
      aviso.compareDocumentPosition(within(principal).getByRole("heading", { level: 1 })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("muestra los cuatro indicadores del mes en USD con sus equivalentes (RF-08, P-57)", async () => {
    servirInicio(inicio());
    renderizarApp({ ruta: "/" });

    expect(await screen.findByRole("heading", { level: 1, name: "Hola, Jose" })).toBeVisible();
    const ventas = await screen.findByRole("group", { name: "Ventas del mes" });
    expect(sinNbsp(ventas.textContent)).toContain("US$ 2.152,00");
    expect(sinNbsp(ventas.textContent)).toContain("$ 8.608.000 · Bs 107.600,00");
    expect(sinNbsp(ventas.textContent)).toContain("23 ventas");
    expect(sinNbsp(ventas.textContent)).toContain("Cobrado: US$ 1.652,00 · $ 2.000.000");
    expect(screen.getByRole("group", { name: "Instalaciones del mes" })).toHaveTextContent("6 instalaciones");
    expect(sinNbsp(screen.getByRole("group", { name: "Utilidad del mes" }).textContent)).toContain(
      "35,11 % sobre lo cobrado",
    );
    expect(screen.getByRole("group", { name: "Inventario valorizado" })).toHaveTextContent(
      "42 productos en bodega",
    );
    const accesos = screen.getByRole("navigation", { name: "Accesos rápidos" });
    expect(
      within(accesos)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Nueva venta", "Nueva instalación", "Registrar compra", "Nueva cotización"]);
  });

  it("stock bajo con su barra, garantías y cotizaciones por vencer y últimos movimientos (RF-10 a RF-13)", async () => {
    servirInicio(inicio());
    renderizarApp({ ruta: "/" });

    const stock = await screen.findByRole("region", { name: "Stock bajo" });
    expect(within(stock).getByRole("link", { name: "Ver inventario" })).toHaveAttribute(
      "href",
      "/inventario",
    );
    expect(stock).toHaveTextContent("Cable UTP50 m / mín. 200");
    expect(within(stock).getByRole("meter", { name: "Nivel de Cable UTP: 25 % del mínimo" })).toHaveAttribute(
      "aria-valuenow",
      "25",
    );
    expect(within(stock).getByRole("link", { name: /Cámara domo 2MP/ })).toHaveAttribute(
      "href",
      "/inventario/productos/10",
    );

    const garantias = screen.getByRole("region", { name: "Garantías por vencer" });
    expect(garantias).toHaveTextContent("1 vence en los próximos 30 días");
    expect(garantias).toHaveTextContent("Ferretería El Tornillo");
    expect(garantias).toHaveTextContent("vence 20/10/2026");
    expect(garantias).toHaveTextContent("14 días");
    expect(within(garantias).getByRole("link", { name: "I-0001" })).toHaveAttribute(
      "href",
      "/instalaciones/80",
    );
    expect(within(garantias).getByRole("link", { name: "Ver todas" })).toHaveAttribute(
      "href",
      "/garantias?estado=POR_VENCER",
    );

    const cotizaciones = screen.getByRole("region", { name: "Cotizaciones en evaluación" });
    const [porVencer, otra] = within(cotizaciones).getAllByRole("listitem");
    expect(porVencer).toHaveTextContent("Por vencer");
    expect(porVencer).toHaveTextContent("Vence en 2 días");
    expect(porVencer).toHaveClass("bg-acento/7");
    expect(otra).not.toHaveTextContent("Por vencer");
    expect(within(porVencer!).getByRole("link")).toHaveAttribute("href", "/cotizaciones/90");
    expect(within(cotizaciones).getByRole("link", { name: "Ver todas" })).toHaveAttribute(
      "href",
      "/cotizaciones?estado=EN_EVALUACION",
    );

    const movimientos = screen.getByRole("region", { name: "Últimos movimientos" });
    const [venta, compra] = within(movimientos).getAllByRole("listitem");
    expect(venta).toHaveTextContent("VentaV-0001 · Ferretería El Tornillo");
    expect(within(venta!).getByRole("link")).toHaveAttribute("href", "/ventas/60");
    expect(compra).toHaveTextContent("Anulado");
    expect(within(compra!).getByRole("link")).toHaveAttribute("href", "/compras/40");
  });

  it("los bloques vacíos lo dicen; si falla, ofrece reintentar", async () => {
    let fallar = true;
    servidor.use(
      http.get("/api/v1/inicio", ({ response }) =>
        fallar ? problema(500, "ERROR_INTERNO", "x") : response(200).json(inicioVacio()),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/" });

    const reintentar = await screen.findByRole("button", { name: "Reintentar" });
    fallar = false;
    await usuario.click(reintentar);
    expect(await screen.findByText("No hay productos por debajo del mínimo.")).toBeVisible();
    expect(screen.getByText("Ninguna garantía vence en los próximos 30 días.")).toBeVisible();
    expect(screen.getByText("No hay cotizaciones esperando respuesta.")).toBeVisible();
    expect(screen.getByText("Todavía no hay movimientos.")).toBeVisible();
  });
});

describe("Indicador de stock bajo en el menú (RF-02, W-13)", () => {
  it("muestra cuántos productos están bajo el mínimo junto a Inventario, en computador y celular", async () => {
    servirInicio(inicio());
    renderizarApp({ ruta: "/usuarios" });

    const menu = await screen.findByRole("navigation", { name: "Menú principal" });
    expect(
      await within(menu).findByRole("link", { name: /^Inventario.*2 productos bajo el mínimo$/ }),
    ).toBeVisible();
  });

  it("en el celular también aparece en la barra inferior", async () => {
    servirInicio(inicio({ totalStockBajo: 1 }));
    renderizarApp({ ruta: "/usuarios", escritorio: false });

    expect(
      await screen.findByRole("link", { name: /^Inventario.*1 producto bajo el mínimo$/ }),
    ).toBeVisible();
  });

  it("se actualiza al guardar un documento que mueve inventario", async () => {
    servirInicio(inicio({ totalStockBajo: 1 }), inicio({ totalStockBajo: 3 }));
    const { clienteConsultas } = renderizarApp({ ruta: "/usuarios" });

    expect(await screen.findByRole("link", { name: /1 producto bajo el mínimo/ })).toBeVisible();
    // Así lo hacen las compras, ventas, instalaciones y ajustes al guardar.
    await clienteConsultas.invalidateQueries();
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /3 productos bajo el mínimo/ })).toBeVisible();
    });
  });
});
