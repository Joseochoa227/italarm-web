import { screen, within } from "@testing-library/react";

import { pagina, productoDetalle, serial, sinCampos } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

const sinNbsp = (t: string | null) => (t ?? "").replace(/[\u00a0\u202f]/g, " ");

function servirDetalle(detalle = productoDetalle()) {
  servidor.use(
    http.get("/api/v1/inventario/productos/{id}", ({ response }) => response(200).json(detalle)),
    http.get("/api/v1/inventario/productos/{id}/kardex", ({ response }) =>
      response(200).json(
        pagina([
          {
            id: 2,
            fecha: "2026-10-03",
            tipo: "AJUSTE_SALIDA",
            tipoEtiqueta: "Ajuste (salida)",
            detalle: "Daño",
            documento: { tipo: "AJUSTE", id: 7, consecutivo: "AJU-0001" },
            salida: "1",
            saldo: "4",
            usuario: "Victor",
          },
          {
            id: 1,
            fecha: "2026-10-01",
            tipo: "COMPRA",
            tipoEtiqueta: "Compra",
            documento: { tipo: "COMPRA", id: 40, consecutivo: "COM-0001" },
            entrada: "5",
            saldo: "5",
            costoUnitarioUsd: { monto: "20.0000", moneda: "USD" },
            usuario: "Jose Ochoa",
          },
        ]),
      ),
    ),
    http.get("/api/v1/inventario/productos/{id}/historial-costo", ({ response }) =>
      response(200).json([
        {
          id: 1,
          fecha: "2026-10-01",
          documento: { tipo: "COMPRA", id: 40, consecutivo: "COM-0001" },
          costoFactura: { monto: "80000.0000", moneda: "COP" },
          tasaFactura: "4000",
          costoNuevoUsd: { monto: "20.0000", moneda: "USD" },
          regla: "SIN_STOCK",
        },
      ]),
    ),
    http.get("/api/v1/inventario/productos/{id}/seriales", ({ response }) =>
      response(200).json([
        serial(),
        serial({
          id: 501,
          numero: "SN-0002",
          estado: "VENDIDO",
          documentoSalida: { tipo: "VENTA", id: 9, consecutivo: "VEN-0001" },
        }),
      ]),
    ),
  );
}

describe("Detalle del producto (RF-53 a RF-57)", () => {
  it("muestra los indicadores en las monedas que entrega el backend", async () => {
    servirDetalle();
    renderizarApp({ ruta: "/inventario/productos/10" });

    expect(await screen.findByRole("heading", { name: "Cámara domo 2MP" })).toBeVisible();
    expect(screen.getByText("CAM-D2 · Cámaras")).toBeVisible();
    expect(screen.getByText("4 und")).toBeVisible();
    expect(screen.getByText("mínimo 5 und · Bajo")).toBeVisible();
    expect(sinNbsp(screen.getByText("Costo actual").parentElement!.textContent)).toContain(
      "US$ 20,00$ 80.000",
    );
    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/inventario/productos/10/editar",
    );
    expect(screen.getByRole("link", { name: "Ajustar inventario" })).toHaveAttribute(
      "href",
      "/inventario/productos/10/ajuste",
    );
  });

  it("muestra el kárdex con enlaces a los documentos y el historial de costo", async () => {
    servirDetalle();
    renderizarApp({ ruta: "/inventario/productos/10" });

    const kardex = await screen.findByRole("table", { name: "Kárdex" });
    const [, ajuste, compra] = within(kardex).getAllByRole("row");
    expect(ajuste).toHaveTextContent("Ajuste (salida)Daño");
    expect(within(ajuste!).getByRole("link", { name: "AJU-0001" })).toHaveAttribute(
      "href",
      "/inventario/ajustes/7",
    );
    expect(within(compra!).getByRole("link", { name: "COM-0001" })).toHaveAttribute("href", "/compras/40");

    const costos = await screen.findByRole("table", { name: "Historial de costo" });
    const fila = within(costos).getAllByRole("row")[1]!;
    expect(sinNbsp(fila.textContent)).toContain("$ 80.000");
    expect(sinNbsp(fila.textContent)).toContain("US$ 20,00");
    expect(within(fila).getByText("sin stock")).toBeVisible();
  });

  it("cuenta los seriales por estado y lleva al historial de cada uno", async () => {
    servirDetalle();
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/10" });

    expect(await screen.findByText("En bodega")).toBeVisible();
    await usuario.click(screen.getByRole("button", { name: "Ver seriales" }));
    const lista = await screen.findByRole("list", { name: "Seriales" });
    expect(within(lista).getByRole("link", { name: "SN-0001" })).toHaveAttribute("href", "/seriales/500");
    expect(within(lista).getByText("Vendido · VEN-0001")).toBeVisible();
  });

  it("sin serial no muestra la sección de seriales; sin costo lo indica", async () => {
    servirDetalle(sinCampos(productoDetalle({ controlaSerial: false, stock: "0" }), "costoActual"));
    renderizarApp({ ruta: "/inventario/productos/10" });

    expect(await screen.findByText("Sin costo todavía")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Ver seriales" })).not.toBeInTheDocument();
  });

  it("si el producto no existe muestra el error", async () => {
    servidor.use(
      http.get("/api/v1/inventario/productos/{id}", () =>
        problema(404, "PRODUCTO_NO_ENCONTRADO", "No existe el producto 99."),
      ),
    );
    renderizarApp({ ruta: "/inventario/productos/99" });
    expect(await screen.findByText(/No existe el producto 99/)).toBeVisible();
  });
});
