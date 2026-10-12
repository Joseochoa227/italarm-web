import { screen, waitFor, within } from "@testing-library/react";

import { cliente, cotizacion, pagina, producto, vistaPreviaCotizacion } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

const sinNbsp = (t: string | null) => (t ?? "").replace(/[\u00a0\u202f]/g, " ");
type Cuerpo = Parameters<typeof vistaPreviaCotizacion>[0] & Record<string, unknown>;

const camara = producto({ id: 10, stock: "3" });
const cable = producto({
  id: 11,
  nombre: "Cable UTP",
  codigo: "CAB-UTP",
  controlaSerial: false,
  unidadMedida: { id: 2, nombre: "Metro", abreviatura: "m", admiteDecimales: true, version: 0 },
});

function servir(opciones: { previa?: (c: Cuerpo) => ReturnType<typeof vistaPreviaCotizacion> } = {}) {
  const previas: Cuerpo[] = [];
  servidor.use(
    http.get("/api/v1/clientes", ({ response }) => response(200).json(pagina([cliente()]))),
    http.get("/api/v1/clientes/{id}", ({ response }) => response(200).json(cliente())),
    http.get("/api/v1/productos", ({ response }) => response(200).json(pagina([camara, cable]))),
    http.post("/api/v1/cotizaciones/vista-previa", async ({ request, response }) => {
      const cuerpo = (await request.json()) as Cuerpo;
      previas.push(cuerpo);
      return response(200).json(opciones.previa ? opciones.previa(cuerpo) : vistaPreviaCotizacion(cuerpo));
    }),
  );
  return previas;
}

type Usuario = ReturnType<typeof renderizarApp>["usuario"];

async function agregar(usuario: Usuario, nombre: RegExp) {
  await usuario.click(screen.getByRole("button", { name: "Agregar producto" }));
  await usuario.click(await screen.findByRole("button", { name: nombre }));
}

async function elegirCliente(usuario: Usuario) {
  await usuario.click(await screen.findByRole("button", { name: "Elegir cliente" }));
  await usuario.click(await screen.findByRole("button", { name: /Ferretería El Tornillo/ }));
}

describe("Nueva cotización (RF-80 a RF-86)", () => {
  it("muestra el costo a la tasa de hoy y a la de compra (CP-09) y la vista previa del PDF sin costos", async () => {
    const previas = servir();
    const { usuario } = renderizarApp({ ruta: "/cotizaciones/nueva" });

    expect(await screen.findByRole("heading", { level: 1, name: "Nueva cotización" })).toBeVisible();
    expect(screen.getByRole("radio", { name: "Instalación" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "15 días" })).toBeChecked();
    await elegirCliente(usuario);
    await usuario.type(screen.getByLabelText("Descripción del trabajo"), "Instalación de 4 cámaras");
    await agregar(usuario, /Cámara domo/);
    const cantidad = screen.getByLabelText("Cantidad de Cámara domo 2MP");
    await usuario.clear(cantidad);
    await usuario.type(cantidad, "4");
    await usuario.type(screen.getByLabelText("Mano de obra"), "40");

    const lineas = screen.getByRole("list", { name: "Ítems" });
    await waitFor(() => {
      expect(sinNbsp(lineas.textContent)).toContain(
        "Costo US$ 19,50Hoy $ 81.900A tasa de compra $ 78.000 (C-0001 · 01/10/2026)",
      );
    });
    expect(screen.getByText("Válida hasta el 21/10/2026")).toBeVisible();
    expect(previas.at(-1)).toMatchObject({
      tipo: "INSTALACION",
      clienteId: 20,
      validezDias: 15,
      descripcion: "Instalación de 4 cámaras",
      manoDeObra: "40",
      lineas: [{ productoId: 10, cantidad: "4" }],
    });

    const pdf = screen.getByRole("region", { name: "Vista previa del PDF" });
    const textoPdf = sinNbsp(pdf.textContent);
    expect(textoPdf).toContain("COTIZACIÓN");
    expect(textoPdf).toContain("Ferretería El Tornillo");
    expect(textoPdf).toContain("Instalación de 4 cámaras");
    expect(textoPdf).toContain("Cámara domo 2MP4 und");
    expect(textoPdf).toContain("Mano de obraUS$ 40,00");
    expect(textoPdf).toContain("TotalUS$ 142,00");
    expect(textoPdf).toContain("Válida hasta: 21/10/2026");
    expect(textoPdf).not.toContain("Costo");
    expect(textoPdf).not.toContain("Utilidad");
  });

  it("cotiza más de lo que hay en bodega con un aviso y guarda en Borrador (CP-26)", async () => {
    servir({
      previa: (c) =>
        vistaPreviaCotizacion(c, {
          lineas: (vistaPreviaCotizacion(c).lineas ?? []).map((l) => ({
            ...l,
            avisoStock: "Stock insuficiente · quedan 3 und",
          })),
        }),
    });
    let guardada: unknown;
    let clave: string | null = null;
    servidor.use(
      http.post("/api/v1/cotizaciones", async ({ request, response }) => {
        guardada = await request.json();
        clave = request.headers.get("Idempotency-Key");
        return response(201).json(cotizacion());
      }),
      http.get("/api/v1/cotizaciones/{id}", ({ response }) => response(200).json(cotizacion())),
    );
    const { usuario, router } = renderizarApp({ ruta: "/cotizaciones/nueva?clienteId=20" });

    expect(await screen.findByRole("button", { name: "Cambiar" })).toBeVisible();
    await usuario.type(screen.getByLabelText("Descripción del trabajo"), "Cuatro cámaras");
    await agregar(usuario, /Cámara domo/);
    await usuario.clear(screen.getByLabelText("Cantidad de Cámara domo 2MP"));
    await usuario.type(screen.getByLabelText("Cantidad de Cámara domo 2MP"), "4");
    await usuario.type(screen.getByLabelText("Precio unitario de Cámara domo 2MP"), "24");

    const aviso = await screen.findByText("Stock insuficiente · quedan 3 und");
    expect(aviso.closest("[role=status]")).not.toBeNull();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await usuario.click(screen.getByRole("radio", { name: "30 días" }));
    await usuario.click(screen.getByRole("button", { name: "Guardar cotización" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/cotizaciones/90");
    });
    expect(guardada).toEqual({
      tipo: "INSTALACION",
      clienteId: 20,
      validezDias: 30,
      moneda: "USD",
      lineas: [{ productoId: 10, cantidad: "4", precioUnitario: "24" }],
      descripcion: "Cuatro cámaras",
      manoDeObra: "0",
      monedasComprobante: [],
      version: 0,
    });
    expect(clave).toMatch(/^[0-9a-f-]{36}$/);
    expect(await screen.findByText("Cotización COT-0001 guardada")).toBeVisible();
  });

  it("valida la descripción en las de instalación y los ítems en las de venta, sin mano de obra", async () => {
    servir();
    const { usuario } = renderizarApp({ ruta: "/cotizaciones/nueva?clienteId=20" });

    await screen.findByRole("button", { name: "Cambiar" });
    await usuario.click(screen.getByRole("button", { name: "Guardar cotización" }));
    expect(await screen.findByText("Describe el trabajo.")).toBeVisible();

    await usuario.click(screen.getByRole("radio", { name: "Venta de material" }));
    expect(screen.queryByLabelText("Descripción del trabajo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Mano de obra")).not.toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Guardar cotización" }));
    expect(await screen.findByText("Agrega al menos un producto.")).toBeVisible();
  });

  it("muestra los errores del backend y no muestra la vista previa del PDF en el celular", async () => {
    servir();
    servidor.use(
      http.post("/api/v1/cotizaciones", () =>
        problema(422, "DESCUENTO_INVALIDO", "El descuento no puede superar el subtotal."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/cotizaciones/nueva?clienteId=20", escritorio: false });

    await screen.findByRole("button", { name: "Cambiar" });
    expect(screen.queryByRole("region", { name: "Vista previa del PDF" })).not.toBeInTheDocument();
    await usuario.click(screen.getByRole("radio", { name: "Venta de material" }));
    await agregar(usuario, /Cable UTP/);
    await usuario.click(screen.getByRole("radio", { name: "Valor" }));
    await usuario.type(screen.getByLabelText("Valor del descuento"), "500");
    await usuario.click(screen.getByRole("button", { name: "Guardar cotización" }));

    expect(await screen.findByText("El descuento no puede superar el subtotal.")).toBeVisible();
    expect(within(screen.getByRole("main")).getByRole("link", { name: "Ver cotizaciones" })).toHaveAttribute(
      "href",
      "/cotizaciones",
    );
  });
});
