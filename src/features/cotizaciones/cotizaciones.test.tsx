import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse } from "msw";

import { cliente, cotizacion, pagina, producto, sinCampos, vistaPreviaCotizacion } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

const sinNbsp = (t: string | null) => (t ?? "").replace(/[\u00a0\u202f]/g, " ");

function servirCotizacion(...versiones: ReturnType<typeof cotizacion>[]) {
  let i = 0;
  servidor.use(
    http.get("/api/v1/cotizaciones/{id}", ({ response }) =>
      response(200).json(versiones[Math.min(i++, versiones.length - 1)]!),
    ),
  );
}

const fila = (cambios: Record<string, unknown>) => ({
  id: 90,
  consecutivo: "COT-0001",
  cliente: "Ferretería El Tornillo",
  clienteId: 20,
  tipo: "INSTALACION",
  estado: "EN_EVALUACION",
  fecha: "2026-10-06",
  vence: "2026-10-21",
  moneda: "USD" as const,
  total: { monto: "142.0000", moneda: "USD" as const },
  registradaPor: "Jose Ochoa",
  ...cambios,
});

describe("Listado de cotizaciones (RF-89 a RF-91)", () => {
  it("muestra estado y días para vencer, resalta las próximas a vencer y filtra", async () => {
    const consultas: URLSearchParams[] = [];
    servidor.use(
      http.get("/api/v1/cotizaciones", ({ request, response }) => {
        consultas.push(new URL(request.url).searchParams);
        return response(200).json(
          pagina([
            fila({ diasParaVencer: 2, porVencer: true }),
            fila({
              id: 91,
              consecutivo: "COT-0002 v2",
              estado: "BORRADOR",
              diasParaVencer: 10,
              porVencer: false,
            }),
            // CP-21: la tarea diaria del backend la venció al día 16.
            // El backend manda null en los días de las que ya no están abiertas.
            fila({ id: 92, consecutivo: "COT-0003", estado: "VENCIDA", tipo: "VENTA", diasParaVencer: null }),
            fila({ id: 93, consecutivo: "COT-0004", estado: "CONVERTIDA", documentoGenerado: "I-0007" }),
          ]),
        );
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/cotizaciones" });

    const lista = await screen.findByRole("list", { name: "Cotizaciones" });
    const [porVencer, borrador, vencida, convertida] = within(lista).getAllByRole("listitem");
    expect(porVencer).toHaveTextContent("COT-0001 · Ferretería El Tornillo");
    expect(porVencer).toHaveTextContent("En evaluación");
    expect(porVencer).toHaveTextContent("Vence en 2 días");
    expect(porVencer).toHaveClass("bg-acento/7");
    expect(borrador).toHaveTextContent("COT-0002 v2");
    expect(borrador).not.toHaveClass("bg-acento/7");
    expect(vencida).toHaveTextContent("Vencida");
    expect(vencida).toHaveTextContent("Venta de material");
    expect(vencida).not.toHaveTextContent(/Vence|null/);
    expect(convertida).toHaveTextContent("Convertida en I-0007");
    expect(within(porVencer!).getByRole("link")).toHaveAttribute("href", "/cotizaciones/90");

    await usuario.selectOptions(screen.getByLabelText("Estado"), "En evaluación");
    await usuario.click(screen.getByLabelText("Por vencer (3 días o menos)"));
    await usuario.selectOptions(screen.getByLabelText("Tipo"), "Instalación");
    await waitFor(() => {
      expect(consultas.at(-1)?.get("tipo")).toBe("INSTALACION");
    });
    expect(consultas.at(-1)?.get("estado")).toBe("EN_EVALUACION");
    expect(consultas.at(-1)?.get("porVencer")).toBe("true");
  });
});

describe("Detalle de la cotización (RF-87 a RF-92)", () => {
  it("en evaluación: datos, versiones anteriores y sus acciones; sin convertir", async () => {
    servirCotizacion(
      cotizacion({
        consecutivo: "COT-0001 v2",
        numeroVersion: 2,
        estado: "EN_EVALUACION",
        enviadaEn: "2026-10-06T16:00:00Z",
        diasParaVencer: 2,
        porVencer: true,
        versionesAnteriores: [
          {
            numeroVersion: 1,
            fecha: "2026-10-05",
            reemplazadaEn: "2026-10-06T15:30:00Z",
            reemplazadaPor: "Victor",
            total: { monto: "160.0000", moneda: "USD" },
            lineas: [
              {
                productoId: 10,
                descripcion: "Cámara domo 2MP",
                unidad: "und",
                cantidad: "5",
                precioUnitario: { monto: "24.0000", moneda: "USD" },
                subtotal: { monto: "120.0000", moneda: "USD" },
              },
            ],
            manoDeObra: { monto: "40.0000", moneda: "USD" },
          },
        ],
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/cotizaciones/90" });

    expect(await screen.findByRole("heading", { level: 1, name: "Cotización COT-0001 v2" })).toBeVisible();
    expect(screen.getByText("Por vencer: Vence en 2 días")).toBeVisible();
    expect(screen.getByText("15 días · hasta el 21/10/2026")).toBeVisible();
    expect(sinNbsp(screen.getByRole("region", { name: "Resumen" }).textContent)).toContain(
      "Mano de obraUS$ 40,00",
    );
    for (const nombre of [
      "Enviar por WhatsApp",
      "Descargar PDF",
      "Seguimiento por WhatsApp",
      "Cliente aprobó",
      "Duplicar",
      "Rechazar",
    ]) {
      expect(screen.getByRole("button", { name: nombre })).toBeVisible();
    }
    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute("href", "/cotizaciones/90/editar");
    expect(screen.queryByRole("link", { name: /Convertir/ })).not.toBeInTheDocument();

    await usuario.click(screen.getByText(/Versión 1 · reemplazada el/));
    const version = screen.getByRole("table", { name: /Versión 1/ });
    expect(sinNbsp(version.textContent)).toContain("Cámara domo 2MP5 undUS$ 24,00US$ 120,00");
    expect(screen.getByText(/por Victor · Total US\$/)).toBeVisible();
  });

  it("aprueba con confirmación y, ya aprobada, ofrece convertirla en instalación", async () => {
    servirCotizacion(cotizacion({ estado: "EN_EVALUACION" }));
    let aprobada = false;
    servidor.use(
      http.post("/api/v1/cotizaciones/{id}/aprobar", ({ response }) => {
        aprobada = true;
        return response(200).json(cotizacion({ estado: "APROBADA", aprobadaEn: "2026-10-07T14:00:00Z" }));
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/cotizaciones/90" });

    await usuario.click(await screen.findByRole("button", { name: "Cliente aprobó" }));
    const dialogo = await screen.findByRole("dialog", { name: "¿El cliente aprobó COT-0001?" });
    await usuario.click(within(dialogo).getByRole("button", { name: "Cliente aprobó" }));

    expect(await screen.findByRole("link", { name: "Convertir en instalación" })).toHaveAttribute(
      "href",
      "/instalaciones/nueva?cotizacionId=90",
    );
    expect(aprobada).toBe(true);
    expect(screen.getByText(/^Aprobada el /)).toBeVisible();
    expect(screen.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cliente aprobó" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rechazar" })).toBeVisible();
  });

  it("si otra persona la cambió de estado, avisa y recarga (transición no permitida)", async () => {
    servirCotizacion(
      cotizacion({ estado: "EN_EVALUACION" }),
      cotizacion({ estado: "RECHAZADA", rechazo: { fecha: "2026-10-07T14:00:00Z", motivo: "PRECIO" } }),
    );
    servidor.use(
      http.post("/api/v1/cotizaciones/{id}/aprobar", () =>
        problema(422, "TRANSICION_NO_PERMITIDA", "Una cotización Rechazada no se puede aprobar."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/cotizaciones/90" });

    await usuario.click(await screen.findByRole("button", { name: "Cliente aprobó" }));
    await usuario.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Cliente aprobó" }),
    );

    expect(
      await screen.findByText("La cotización cambió de estado. Se cargó la información actual."),
    ).toBeVisible();
    expect(await screen.findByText(/^Rechazada el .* · Precio$/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Cliente aprobó" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rechazar" })).not.toBeInTheDocument();
  });

  it("rechaza con motivo y detalle, y duplica una rechazada (P-47, P-52, P-53)", async () => {
    servirCotizacion(cotizacion({ estado: "APROBADA" }));
    let rechazo: unknown;
    let clave: string | null = null;
    servidor.use(
      http.post("/api/v1/cotizaciones/{id}/rechazar", async ({ request, response }) => {
        rechazo = await request.json();
        return response(200).json(
          cotizacion({
            estado: "RECHAZADA",
            rechazo: { fecha: "2026-10-07T14:00:00Z", motivo: "COMPETENCIA", detalle: "Otro proveedor" },
          }),
        );
      }),
      http.post("/api/v1/cotizaciones/{id}/duplicar", ({ request, response }) => {
        clave = request.headers.get("Idempotency-Key");
        return response(201).json(cotizacion({ id: 95, consecutivo: "COT-0005" }));
      }),
    );
    const { usuario, router } = renderizarApp({ ruta: "/cotizaciones/90" });

    await usuario.click(await screen.findByRole("button", { name: "Rechazar" }));
    const dialogo = await screen.findByRole("dialog", { name: "Rechazar COT-0001" });
    await usuario.selectOptions(within(dialogo).getByLabelText("Motivo"), "Competencia");
    await usuario.type(within(dialogo).getByLabelText("Detalle"), "Otro proveedor");
    await usuario.click(within(dialogo).getByRole("button", { name: "Rechazar" }));

    expect(await screen.findByText(/· Competencia: Otro proveedor$/)).toBeVisible();
    expect(rechazo).toEqual({ motivo: "COMPETENCIA", detalle: "Otro proveedor" });
    expect(screen.queryByRole("link", { name: /Convertir/ })).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Duplicar" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/cotizaciones/95");
    });
    expect(clave).toMatch(/^[0-9a-f-]{36}$/);
    expect(await screen.findByText("Se creó COT-0005 en Borrador")).toBeVisible();
  });

  it("al descargar el PDF de un borrador lo marca como enviado (P-50); el seguimiento abre WhatsApp", async () => {
    servirCotizacion(cotizacion());
    let enviada = 0;
    servidor.use(
      http.get(
        "/api/v1/cotizaciones/{id}/comprobante",
        () =>
          new HttpResponse("%PDF", {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": 'attachment; filename="COT-0001.pdf"',
            },
          }),
      ),
      http.post("/api/v1/cotizaciones/{id}/enviar", ({ response }) => {
        enviada++;
        return response(200).json(cotizacion({ estado: "EN_EVALUACION", enviadaEn: "2026-10-06T16:00:00Z" }));
      }),
      http.get("/api/v1/cotizaciones/{id}/seguimiento", ({ response }) =>
        response(200).json({ mensaje: "Hola", whatsappUrl: "https://wa.me/573001234567?text=Hola" }),
      ),
    );
    const ventana = { opener: {}, location: { href: "" }, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(ventana as unknown as Window);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:pdf");
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const { usuario } = renderizarApp({ ruta: "/cotizaciones/90" });

    await usuario.click(await screen.findByRole("button", { name: "Descargar PDF" }));
    expect(await screen.findByText(/^Enviada el /)).toBeVisible();
    expect(enviada).toBe(1);
    expect(screen.getByText("En evaluación")).toBeVisible();

    await usuario.click(screen.getByRole("button", { name: "Seguimiento por WhatsApp" }));
    await waitFor(() => {
      expect(ventana.location.href).toBe("https://wa.me/573001234567?text=Hola");
    });
  });
});

describe("Detalle: otros estados y datos", () => {
  it("una de venta vencida en pesos, con descuento en porcentaje y observaciones; solo se duplica", async () => {
    servirCotizacion(
      sinCampos(
        cotizacion({
          tipo: "VENTA",
          estado: "VENCIDA",
          moneda: "COP",
          vencidaEl: "2026-10-22",
          descuentoTipo: "PORCENTAJE",
          descuentoValor: "10.0000",
          observaciones: "Precios sujetos a cambio",
          resumen: {
            subtotal: { cop: { monto: "400000.0000", moneda: "COP" } },
            descuento: {
              usd: { monto: "10.0000", moneda: "USD" },
              cop: { monto: "40000.0000", moneda: "COP" },
            },
            total: { cop: { monto: "360000.0000", moneda: "COP" } },
          },
          tasas: {},
          cliente: { nombre: "Cliente sin ficha" },
        }),
        "porcentajeUtilidad",
      ),
    );
    renderizarApp({ ruta: "/cotizaciones/90" });

    expect(await screen.findByText("Vencida el 22/10/2026")).toBeVisible();
    const resumen = sinNbsp(screen.getByRole("region", { name: "Resumen" }).textContent);
    expect(resumen).toContain("Descuento (10 %)$ 40.000");
    expect(resumen).toContain("Total de contado$ 360.000");
    expect(resumen).not.toContain("Mano de obra");
    expect(resumen).toContain("Observaciones: Precios sujetos a cambio");
    expect(screen.queryByRole("link", { name: "Cliente sin ficha" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rechazar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Seguimiento por WhatsApp" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duplicar" })).toBeVisible();
  });

  it("una rechazada sin motivo lo indica en el historial", async () => {
    servirCotizacion(cotizacion({ estado: "RECHAZADA", rechazo: { fecha: "2026-10-07T14:00:00Z" } }));
    renderizarApp({ ruta: "/cotizaciones/90" });

    expect(await screen.findByText(/^Rechazada el .* · —$/)).toBeVisible();
  });
});

describe("Editar una cotización (RF-88, P-46)", () => {
  it("en evaluación avisa que se crea la versión 2 y envía todo con la versión", async () => {
    servirCotizacion(cotizacion({ estado: "EN_EVALUACION", version: 3 }));
    let cuerpo: unknown;
    servidor.use(
      http.get("/api/v1/clientes/{id}", ({ response }) => response(200).json(cliente())),
      http.get("/api/v1/productos", ({ response }) => response(200).json(pagina([producto()]))),
      http.post("/api/v1/cotizaciones/vista-previa", async ({ request, response }) =>
        response(200).json(vistaPreviaCotizacion(await request.json())),
      ),
      http.put("/api/v1/cotizaciones/{id}", async ({ request, response }) => {
        cuerpo = await request.json();
        return response(200).json(
          cotizacion({ consecutivo: "COT-0001 v2", numeroVersion: 2, estado: "EN_EVALUACION" }),
        );
      }),
    );
    const { usuario, router } = renderizarApp({ ruta: "/cotizaciones/90/editar" });

    expect(await screen.findByRole("heading", { level: 1, name: "Editar COT-0001" })).toBeVisible();
    expect(
      screen.getByText(
        "La cotización ya se envió: al guardar se crea la versión 2 y la anterior queda guardada.",
      ),
    ).toBeVisible();
    expect(screen.getByLabelText("Precio unitario de Cámara domo 2MP")).toHaveValue("25,5");
    expect(screen.getByLabelText("Mano de obra")).toHaveValue("40");
    const cantidad = screen.getByLabelText("Cantidad de Cámara domo 2MP");
    await usuario.clear(cantidad);
    await usuario.type(cantidad, "5");
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/cotizaciones/90");
    });
    expect(cuerpo).toMatchObject({
      tipo: "INSTALACION",
      clienteId: 20,
      validezDias: 15,
      lineas: [{ productoId: 10, cantidad: "5", precioUnitario: "25.5" }],
      descripcion: "Instalación de 4 cámaras",
      manoDeObra: "40",
      version: 3,
    });
    expect(await screen.findByText("Cotización COT-0001 v2 guardada")).toBeVisible();
  });
});

describe("Cotizaciones del cliente (P-36)", () => {
  it("el detalle del cliente muestra sus últimas cotizaciones con el enlace al listado", async () => {
    servidor.use(
      http.get("/api/v1/clientes/{id}", ({ response }) => response(200).json(cliente())),
      http.get("/api/v1/clientes/{id}/historial", ({ response }) => response(200).json({ movimientos: [] })),
      http.get("/api/v1/cotizaciones", ({ response }) =>
        response(200).json(pagina([fila({ estado: "APROBADA" })])),
      ),
    );
    renderizarApp({ ruta: "/clientes/20" });

    const lista = await screen.findByRole("list", { name: "Cotizaciones" });
    expect(within(lista).getByRole("link", { name: "COT-0001" })).toHaveAttribute("href", "/cotizaciones/90");
    expect(lista).toHaveTextContent("Aprobada");
    expect(screen.getByRole("link", { name: "Ver todas" })).toHaveAttribute(
      "href",
      "/cotizaciones?cliente=20&clienteNombre=Ferreter%C3%ADa%20El%20Tornillo",
    );
  });
});
