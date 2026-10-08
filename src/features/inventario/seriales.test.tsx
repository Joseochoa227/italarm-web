import { screen, waitFor, within } from "@testing-library/react";

import { serial } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatReader: class {
    decodeFromVideoDevice(
      _dispositivo: unknown,
      _video: unknown,
      alLeer: (r: { getText: () => string }, e: unknown, c: { stop: () => void }) => void,
    ) {
      setTimeout(() => {
        alLeer({ getText: () => " sn-0002 " }, undefined, { stop: () => undefined });
      }, 0);
      return Promise.resolve({ stop: () => undefined });
    }
  },
}));

function servirBusqueda() {
  const buscados: string[] = [];
  servidor.use(
    http.get("/api/v1/seriales", ({ query, response }) => {
      const numero = query.get("numero");
      buscados.push(numero);
      return response(200).json(
        numero === "NADA"
          ? []
          : [serial(), serial({ id: 501, numero: "SN-0002", estado: "VENDIDO" })].filter((s) =>
              s.numero?.includes(numero),
            ),
      );
    }),
  );
  return buscados;
}

describe("Buscar serial desde el menú (RF-24, W-06)", () => {
  it("en el computador busca desde el menú lateral y lleva al historial", async () => {
    const buscados = servirBusqueda();
    servidor.use(
      http.get("/api/v1/seriales/{id}", ({ response }) =>
        response(200).json({ serial: serial(), movimientos: [], reclamos: [] }),
      ),
    );
    const { usuario, router } = renderizarApp({ ruta: "/", escritorio: true });

    await usuario.click(await screen.findByRole("button", { name: "Buscar serial" }));
    const dialogo = await screen.findByRole("dialog", { name: "Buscar un serial" });
    await usuario.type(within(dialogo).getByLabelText("Número de serie"), " sn-0{Enter}");

    const resultados = await within(dialogo).findByRole("list", { name: "Seriales encontrados" });
    expect(buscados).toEqual(["SN-0"]);
    expect(within(resultados).getAllByRole("link")).toHaveLength(2);
    expect(within(resultados).getByText("Cámara domo 2MP · Vendido")).toBeVisible();

    await usuario.click(within(resultados).getByRole("link", { name: /SN-0001/ }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/seriales/500");
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("en el celular la lupa está en la barra superior; pide al menos 2 caracteres y avisa si no hay", async () => {
    servirBusqueda();
    const { usuario } = renderizarApp({ ruta: "/" });

    await usuario.click(await screen.findByRole("button", { name: "Buscar serial" }));
    const dialogo = await screen.findByRole("dialog", { name: "Buscar un serial" });
    const campo = within(dialogo).getByLabelText("Número de serie");
    await usuario.type(campo, "x");
    await usuario.click(within(dialogo).getByRole("button", { name: "Buscar" }));
    expect(await within(dialogo).findByText("Escribe al menos 2 caracteres.")).toBeVisible();

    await usuario.clear(campo);
    await usuario.type(campo, "nada{Enter}");
    expect(await within(dialogo).findByText("No se encontró ningún serial con ese número.")).toBeVisible();
  });

  it("busca el serial leído con la cámara", async () => {
    const buscados = servirBusqueda();
    const { usuario } = renderizarApp({ ruta: "/" });

    await usuario.click(await screen.findByRole("button", { name: "Buscar serial" }));
    const dialogo = await screen.findByRole("dialog", { name: "Buscar un serial" });
    await usuario.click(within(dialogo).getByRole("button", { name: "Escanear" }));

    const resultados = await screen.findByRole("list", { name: "Seriales encontrados" });
    expect(buscados).toEqual(["SN-0002"]);
    expect(within(resultados).getByRole("link", { name: /SN-0002/ })).toHaveAttribute(
      "href",
      "/seriales/501",
    );
    expect(screen.getByLabelText("Número de serie")).toHaveValue("SN-0002");
  });
});

describe("Historial del serial (RF-24)", () => {
  it("muestra el estado, los documentos, los movimientos y los reclamos", async () => {
    servidor.use(
      http.get("/api/v1/seriales/{id}", ({ response }) =>
        response(200).json({
          serial: serial({
            estado: "VENDIDO",
            documentoSalida: { tipo: "VENTA", id: 9, consecutivo: "VEN-0001" },
            vencimientoGarantia: "2027-10-02",
          }),
          movimientos: [
            {
              tipo: "ENTRADA",
              fecha: "2026-10-01",
              documento: { tipo: "COMPRA", id: 40, consecutivo: "COM-0001" },
              usuario: "Jose Ochoa",
              registradoEn: "2026-10-01T15:00:00Z",
            },
            {
              tipo: "VENTA",
              fecha: "2026-10-02",
              detalle: "Ferretería El Tornillo",
              documento: { tipo: "VENTA", id: 9, consecutivo: "VEN-0001" },
              usuario: "Victor",
              registradoEn: "2026-10-02T15:00:00Z",
            },
          ],
          reclamos: [{ id: 1, fecha: "2026-10-05", problema: "No enciende", enGarantia: false }],
        }),
      ),
    );
    renderizarApp({ ruta: "/seriales/500" });

    expect(await screen.findByRole("heading", { name: "Serial SN-0001" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Cámara domo 2MP" })).toHaveAttribute(
      "href",
      "/inventario/productos/10",
    );
    expect(screen.getByText("Vendido")).toBeVisible();
    expect(screen.getByText("02/10/2027")).toBeVisible();

    const movimientos = screen.getByRole("list", { name: "Historial" });
    const [entrada, venta] = within(movimientos).getAllByRole("listitem");
    expect(entrada).toHaveTextContent("Entrada");
    expect(within(entrada!).getByRole("link", { name: "COM-0001" })).toHaveAttribute("href", "/compras/40");
    expect(venta).toHaveTextContent("VentaFerretería El Tornillo");
    expect(within(venta!).getByText("VEN-0001")).toBeVisible();

    const reclamos = screen.getByRole("list", { name: "Reclamos" });
    expect(within(reclamos).getByText("No enciende")).toBeVisible();
    expect(within(reclamos).getByText("Fuera de garantía")).toBeVisible();
  });

  it("si no existe muestra el error", async () => {
    servidor.use(
      http.get("/api/v1/seriales/{id}", () => problema(404, "NO_ENCONTRADO", "El serial no existe.")),
    );
    renderizarApp({ ruta: "/seriales/9" });
    expect(await screen.findByText(/El serial no existe/)).toBeVisible();
  });
});
