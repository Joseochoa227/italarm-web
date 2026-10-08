import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse } from "msw";

import { cliente, pagina, venta } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

const sinNbsp = (t: string | null) => (t ?? "").replace(/[\u00a0\u202f]/g, " ");

function servirVenta(...versiones: ReturnType<typeof venta>[]) {
  let i = 0;
  servidor.use(
    http.get("/api/v1/ventas/{id}", ({ response }) =>
      response(200).json(versiones[Math.min(i++, versiones.length - 1)]!),
    ),
  );
}

describe("Listado de ventas (RF-105)", () => {
  it("muestra las ventas del mes con totales y utilidad, y filtra por cliente", async () => {
    const consultas: URLSearchParams[] = [];
    servidor.use(
      http.get("/api/v1/clientes", ({ response }) => response(200).json(pagina([cliente()]))),
      http.get("/api/v1/ventas", ({ request, response }) => {
        consultas.push(new URL(request.url).searchParams);
        return response(200).json({
          desde: "2026-10-01",
          hasta: "2026-10-31",
          totalesPorMoneda: [
            {
              ventas: 1,
              total: { monto: "25.5000", moneda: "USD" },
              utilidad: { monto: "8.0000", moneda: "USD" },
            },
          ],
          totalUsd: { monto: "25.5000", moneda: "USD" },
          utilidadUsd: { monto: "8.0000", moneda: "USD" },
          ventas: pagina([
            {
              id: 60,
              consecutivo: "V-0001",
              cliente: "Ferretería El Tornillo",
              fecha: "2026-10-06",
              estado: "ACTIVA",
              moneda: "USD",
              productos: "Cámara domo 2MP × 1",
              registradaPor: "Jose Ochoa",
              total: { monto: "25.5000", moneda: "USD" },
              utilidad: { monto: "8.0000", moneda: "USD" },
            },
            { id: 61, consecutivo: "V-0002", cliente: "Ana Gómez", estado: "ANULADA", moneda: "USD" },
          ]),
        });
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/ventas" });

    const lista = await screen.findByRole("list", { name: "Ventas del período" });
    const [primera, anulada] = within(lista).getAllByRole("listitem");
    expect(primera).toHaveTextContent("V-0001 · Ferretería El Tornillo");
    expect(primera).toHaveTextContent("06/10/2026 · Jose Ochoa");
    expect(sinNbsp(primera!.textContent)).toContain("Utilidad US$ 8,00");
    expect(within(primera!).getByRole("link")).toHaveAttribute("href", "/ventas/60");
    expect(within(anulada!).getByText("Anulada")).toBeVisible();
    expect(sinNbsp(screen.getByRole("region", { name: "Totales del período" }).textContent)).toContain(
      "Utilidad en USDUS$ 8,00",
    );
    expect(within(screen.getByRole("main")).getByRole("link", { name: "Nueva venta" })).toHaveAttribute(
      "href",
      "/ventas/nueva",
    );

    await usuario.click(screen.getByRole("button", { name: "Cliente" }));
    await usuario.click(await screen.findByRole("button", { name: /Ferretería El Tornillo/ }));
    await waitFor(() => {
      expect(consultas.at(-1)?.get("clienteId")).toBe("20");
    });
    expect(
      screen.getByRole("button", { name: "Cliente: Ferretería El Tornillo. Quitar filtro" }),
    ).toBeVisible();
  });

  it("Nueva venta enlaza al listado (W-09)", async () => {
    renderizarApp({ ruta: "/ventas/nueva" });
    expect(await screen.findByRole("link", { name: "Ver ventas" })).toHaveAttribute("href", "/ventas");
  });
});

describe("Detalle de la venta", () => {
  it("muestra lo guardado: garantía por serial (CP-25) y la utilidad registrada (CP-08)", async () => {
    servirVenta(venta());
    renderizarApp({ ruta: "/ventas/60" });

    expect(await screen.findByRole("heading", { name: "Venta V-0001" })).toBeVisible();
    const fila = within(screen.getByRole("table", { name: "Productos" })).getAllByRole("row")[1]!;
    expect(fila).toHaveTextContent("SN-0001 · garantía hasta 06/01/2027");
    expect(within(fila).getByRole("link", { name: "SN-0001" })).toHaveAttribute("href", "/seriales/500");
    expect(sinNbsp(fila.textContent)).toContain("US$ 17,50");
    const resumen = screen.getByRole("region", { name: "Resumen" });
    expect(sinNbsp(resumen.textContent)).toContain("Utilidad · 31,37 %US$ 8,00");
    expect(sinNbsp(resumen.textContent)).toContain("Total de contadoUS$ 25,50$ 102.000");
    expect(screen.getByRole("link", { name: "Ferretería El Tornillo" })).toHaveAttribute(
      "href",
      "/clientes/20",
    );
  });

  it("anula con motivo (CP-18) y la venta queda visible como anulada", async () => {
    servirVenta(venta());
    let motivo: unknown;
    servidor.use(
      http.post("/api/v1/ventas/{id}/anular", async ({ request, response }) => {
        motivo = await request.json();
        return response(200).json(
          venta({
            estado: "ANULADA",
            anulacion: { motivo: "Cliente desistió", usuario: "Victor", fecha: "2026-10-06T16:00:00Z" },
          }),
        );
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/ventas/60" });

    await usuario.click(await screen.findByRole("button", { name: "Anular" }));
    const dialogo = await screen.findByRole("dialog", { name: "¿Anular la venta V-0001?" });
    expect(dialogo).toHaveTextContent("los seriales quedan disponibles");
    await usuario.click(within(dialogo).getByRole("button", { name: "Anular" }));
    expect(within(dialogo).getByText("Escribe el motivo.")).toBeVisible();
    await usuario.type(within(dialogo).getByLabelText("Motivo de la anulación"), "Cliente desistió");
    await usuario.click(within(dialogo).getByRole("button", { name: "Anular" }));

    expect(await screen.findByText("Venta V-0001 anulada")).toBeVisible();
    expect(motivo).toEqual({ motivo: "Cliente desistió" });
    expect(screen.getByText("Venta anulada")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Anular" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar PDF" })).toBeVisible();
  });

  it("edita observaciones y monedas del comprobante; si otro usuario la cambió, recarga y avisa", async () => {
    servirVenta(venta(), venta({ observaciones: "De otro usuario", version: 3 }));
    let cuerpo: unknown;
    let intentos = 0;
    servidor.use(
      http.put("/api/v1/ventas/{id}", async ({ request, response }) => {
        cuerpo = await request.json();
        intentos++;
        return intentos === 1
          ? problema(409, "MODIFICADO_POR_OTRO_USUARIO", "Otro usuario la modificó.")
          : response(200).json(venta({ observaciones: "Entrega en obra", version: 4 }));
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/ventas/60" });

    await usuario.type(await screen.findByLabelText("Observaciones"), "Entrega en obra");
    await usuario.click(screen.getByRole("checkbox", { name: "COP" }));
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(cuerpo).toEqual({ observaciones: "Entrega en obra", monedasComprobante: ["COP"], version: 0 });
    expect(await screen.findByText(/Otro usuario modificó este registro/)).toBeVisible();
    await waitFor(() => {
      expect(screen.getByLabelText("Observaciones")).toHaveValue("De otro usuario");
    });

    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Cambios guardados")).toBeVisible();
    expect(cuerpo).toMatchObject({ version: 3 });
  });
});

describe("Comprobante (RF-133, RF-134)", () => {
  function servirComprobante() {
    servirVenta(venta());
    servidor.use(
      http.get(
        "/api/v1/ventas/{id}/comprobante",
        () =>
          new HttpResponse("%PDF", {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": 'attachment; filename="V-0001.pdf"',
            },
          }),
      ),
      http.post("/api/v1/ventas/{id}/enlace", ({ response }) =>
        response(200).json({
          url: "http://api.prueba/api/v1/comprobantes/abc",
          whatsappUrl: "https://wa.me/573001234567?text=Comprobante",
          venceEn: "2026-11-05T00:00:00Z",
        }),
      ),
    );
  }

  it("descarga el PDF con la sesión", async () => {
    servirComprobante();
    const crear = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:pdf");
    const nombres: string[] = [];
    const clic = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      nombres.push(this.download);
    });
    const { usuario } = renderizarApp({ ruta: "/ventas/60" });
    await usuario.click(await screen.findByRole("button", { name: "Descargar PDF" }));
    await waitFor(() => {
      expect(nombres).toEqual(["V-0001.pdf"]);
    });
    crear.mockRestore();
    clic.mockRestore();
  });

  it("en el computador abre WhatsApp con el enlace", async () => {
    servirComprobante();
    const ventana = { opener: {}, location: { href: "" }, close: vi.fn() };
    const abrir = vi.spyOn(window, "open").mockReturnValue(ventana as unknown as Window);
    const { usuario } = renderizarApp({ ruta: "/ventas/60" });
    await usuario.click(await screen.findByRole("button", { name: "Enviar por WhatsApp" }));
    await waitFor(() => {
      expect(ventana.location.href).toBe("https://wa.me/573001234567?text=Comprobante");
    });
    expect(ventana.opener).toBeNull();
    abrir.mockRestore();
  });

  it("en el celular comparte el PDF adjunto con el compartir del sistema", async () => {
    servirComprobante();
    const compartidos: ShareData[] = [];
    Object.assign(navigator, {
      canShare: () => true,
      share: (datos: ShareData) => {
        compartidos.push(datos);
        return Promise.resolve();
      },
    });
    const abrir = vi.spyOn(window, "open");
    const { usuario } = renderizarApp({ ruta: "/ventas/60", escritorio: false });
    await usuario.click(await screen.findByRole("button", { name: "Enviar por WhatsApp" }));
    await waitFor(() => {
      expect(compartidos).toHaveLength(1);
    });
    expect(compartidos[0]?.files?.[0]?.name).toBe("V-0001.pdf");
    expect(abrir).not.toHaveBeenCalled();
    abrir.mockRestore();
    Object.assign(navigator, { canShare: undefined, share: undefined });
  });
});
