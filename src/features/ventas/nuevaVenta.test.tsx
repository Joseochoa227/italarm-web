import { screen, waitFor, within } from "@testing-library/react";

import { cliente, pagina, producto, serial, venta, vistaPreviaVenta } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatReader: class {
    decodeFromVideoDevice(
      _d: unknown,
      _v: unknown,
      alLeer: (r: { getText: () => string }, e: unknown, c: { stop: () => void }) => void,
    ) {
      setTimeout(() => {
        alLeer({ getText: () => "sn-9999" }, undefined, { stop: () => undefined });
      }, 0);
      return Promise.resolve({ stop: () => undefined });
    }
  },
}));

const sinNbsp = (t: string | null) => (t ?? "").replace(/[\u00a0\u202f]/g, " ");
type Cuerpo = Parameters<typeof vistaPreviaVenta>[0] & { clienteId: number; descuentoTipo?: string };

const camara = producto({ id: 10, stock: "4" });
const cable = producto({
  id: 11,
  nombre: "Cable UTP",
  codigo: "CAB-UTP",
  controlaSerial: false,
  unidadMedida: { id: 2, nombre: "Metro", abreviatura: "m", admiteDecimales: true, version: 0 },
});

function servir(opciones: { previa?: (c: Cuerpo) => ReturnType<typeof vistaPreviaVenta> } = {}) {
  const previas: Cuerpo[] = [];
  servidor.use(
    http.get("/api/v1/clientes", ({ response }) =>
      response(200).json(
        pagina([cliente(), cliente({ id: 21, nombre: "Ana Gómez", tipo: "CLIENTE_FINAL" })]),
      ),
    ),
    http.get("/api/v1/clientes/{id}", ({ response }) => response(200).json(cliente())),
    http.get("/api/v1/productos", ({ response }) => response(200).json(pagina([camara, cable]))),
    http.get("/api/v1/inventario/productos/{id}/seriales", ({ response }) =>
      response(200).json([serial(), serial({ id: 501, numero: "SN-0002" })]),
    ),
    http.post("/api/v1/ventas/vista-previa", async ({ request, response }) => {
      const cuerpo = (await request.json()) as Cuerpo;
      previas.push(cuerpo);
      return response(200).json(opciones.previa ? opciones.previa(cuerpo) : vistaPreviaVenta(cuerpo));
    }),
  );
  return previas;
}

async function agregar(usuario: ReturnType<typeof renderizarApp>["usuario"], nombre: RegExp) {
  await usuario.click(screen.getByRole("button", { name: "Agregar producto" }));
  await usuario.click(await screen.findByRole("button", { name: nombre }));
}

async function elegirCliente(usuario: ReturnType<typeof renderizarApp>["usuario"]) {
  await usuario.click(await screen.findByRole("button", { name: "Elegir cliente" }));
  await usuario.click(await screen.findByRole("button", { name: /Ferretería El Tornillo/ }));
}

describe("Nueva venta (RF-97 a RF-103)", () => {
  it("muestra el precio del cliente, la vista previa por línea y el resumen con descuento (CP-27)", async () => {
    const previas = servir();
    const { usuario } = renderizarApp({ ruta: "/ventas/nueva" });

    expect(await screen.findByText("El consecutivo se asigna al guardar.")).toBeVisible();
    await elegirCliente(usuario);
    expect(screen.getByText("Se le aplicará el precio instalador")).toBeVisible();

    await agregar(usuario, /Cable UTP/);
    const cantidad = screen.getByLabelText("Cantidad de Cable UTP");
    await usuario.clear(cantidad);
    await usuario.type(cantidad, "2,5");

    const lineas = screen.getByRole("list", { name: "Productos" });
    await waitFor(() => {
      expect(sinNbsp(lineas.textContent)).toContain("US$ 25,50 / m · hay 4 m");
    });
    expect(sinNbsp(lineas.textContent)).toContain(
      "Costo US$ 17,50Hoy $ 70.000A tasa de compra $ 68.000 (C-0001 · 01/10/2026)",
    );

    await usuario.click(screen.getByRole("radio", { name: "Valor" }));
    await usuario.type(screen.getByLabelText("Valor del descuento"), "7");
    await waitFor(() => {
      expect(previas.at(-1)).toMatchObject({ descuentoTipo: "VALOR", descuentoValor: "7" });
    });
    const resumen = screen.getByRole("complementary", { name: "Resumen" });
    expect(sinNbsp(within(resumen).getByRole("status", { name: "Total de contado" }).textContent)).toContain(
      "US$ 93,00$ 372.000",
    );
    expect(sinNbsp(resumen.textContent)).toContain("UtilidadUS$ 23,00 · 24,73 %");
    expect(previas.at(-1)).toMatchObject({
      clienteId: 20,
      moneda: "USD",
      lineas: [{ productoId: 11, cantidad: "2.5" }],
    });
  });

  it("llega con el cliente de su pantalla y permite crear uno nuevo sin salir (RF-79)", async () => {
    servir();
    let creado: unknown;
    servidor.use(
      http.post("/api/v1/clientes", async ({ request, response }) => {
        creado = await request.json();
        return response(201).json(cliente({ id: 22, nombre: "Pedro Ruiz", tipo: "CLIENTE_FINAL" }));
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/ventas/nueva?clienteId=20" });

    expect(await screen.findByText("Ferretería El Tornillo")).toBeVisible();
    await usuario.click(screen.getByRole("button", { name: "Cambiar" }));
    const dialogo = await screen.findByRole("dialog", { name: "Elegir cliente" });
    await usuario.click(within(dialogo).getByRole("button", { name: "Nuevo cliente" }));
    const formulario = await screen.findByRole("dialog", { name: "Nuevo cliente" });
    await usuario.type(within(formulario).getByLabelText("Nombre o razón social"), "Pedro Ruiz");
    await usuario.type(within(formulario).getByLabelText("Teléfono / WhatsApp"), "3001112233");
    await usuario.click(within(formulario).getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Pedro Ruiz")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(creado).toMatchObject({ nombre: "Pedro Ruiz", version: 0 });
  });

  it("sin stock suficiente avisa en la línea y no deja guardar (RF-101)", async () => {
    servir({
      previa: (c) => {
        const base = vistaPreviaVenta(c, { puedeGuardar: false });
        return {
          ...base,
          lineas: (base.lineas ?? []).map((l) => ({ ...l, avisoStock: "Stock insuficiente · quedan 4 m" })),
        };
      },
    });
    const { usuario } = renderizarApp({ ruta: "/ventas/nueva" });
    await elegirCliente(usuario);
    await agregar(usuario, /Cable UTP/);
    const cantidad = screen.getByLabelText("Cantidad de Cable UTP");
    await usuario.clear(cantidad);
    await usuario.type(cantidad, "9");

    expect(await screen.findByText("Stock insuficiente · quedan 4 m")).toBeVisible();
    expect(screen.getByText("No se puede guardar: hay productos sin stock suficiente.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Guardar venta" })).toBeDisabled();
  });

  it("los seriales se eligen entre los que están en bodega (CP-14)", async () => {
    const previas = servir();
    const { usuario } = renderizarApp({ ruta: "/ventas/nueva" });
    await elegirCliente(usuario);
    await agregar(usuario, /Cámara domo 2MP/);

    expect(screen.queryByLabelText("Cantidad de Cámara domo 2MP")).not.toBeInTheDocument();
    const chip = await screen.findByRole("button", { name: "Serial SN-0002 de Cámara domo 2MP" });
    await usuario.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => {
      expect(previas.at(-1)?.lineas).toEqual([{ productoId: 10, seriales: ["SN-0002"] }]);
    });

    await usuario.click(screen.getByRole("button", { name: "Escanear" }));
    expect(await screen.findByText("SN-9999 no está en bodega para este producto.")).toBeVisible();
  });

  it("el precio se puede cambiar (aviso si queda bajo el costo) y vuelve al sugerido al cambiar la moneda", async () => {
    const previas = servir({
      previa: (c) => {
        const base = vistaPreviaVenta(c);
        const bajo = c.lineas.some((l) => l.precioUnitario === "10");
        return bajo
          ? {
              ...base,
              lineas: (base.lineas ?? []).map((l) => ({
                ...l,
                avisoPrecio: "El precio queda por debajo del costo.",
              })),
            }
          : base;
      },
    });
    const { usuario } = renderizarApp({ ruta: "/ventas/nueva" });
    await elegirCliente(usuario);
    await agregar(usuario, /Cable UTP/);
    const precio = screen.getByLabelText("Precio unitario de Cable UTP");
    await usuario.type(precio, "10");

    expect(await screen.findByText("El precio queda por debajo del costo.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Guardar venta" })).toBeEnabled();

    await usuario.click(screen.getByRole("radio", { name: "COP" }));
    expect(precio).toHaveValue("");
    expect(screen.getByText(/los precios escritos a mano volvieron al sugerido/)).toBeVisible();
    await waitFor(() => {
      expect(previas.at(-1)).toMatchObject({ moneda: "COP", lineas: [{ productoId: 11, cantidad: "1" }] });
    });
    expect(previas.at(-1)?.lineas[0]).not.toHaveProperty("precioUnitario");
  });

  it("guarda con la clave de idempotencia y muestra la confirmación (RF-104)", async () => {
    servir();
    let cuerpo: unknown;
    const claves: (string | null)[] = [];
    servidor.use(
      http.post("/api/v1/ventas", async ({ request, response }) => {
        cuerpo = await request.json();
        claves.push(request.headers.get("Idempotency-Key"));
        return response(201).json(venta({ consecutivo: "V-0007", id: 70 }));
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/ventas/nueva" });
    await elegirCliente(usuario);
    await agregar(usuario, /Cámara domo 2MP/);
    await usuario.click(await screen.findByRole("button", { name: "Serial SN-0001 de Cámara domo 2MP" }));
    await usuario.click(screen.getByRole("checkbox", { name: "COP" }));
    await usuario.type(screen.getByLabelText("Observaciones"), "Entrega en obra");
    await usuario.click(screen.getByRole("button", { name: "Guardar venta" }));

    expect(await screen.findByRole("heading", { name: "Venta V-0007 registrada" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver la venta" })).toHaveAttribute("href", "/ventas/70");
    expect(cuerpo).toEqual({
      clienteId: 20,
      moneda: "USD",
      lineas: [{ productoId: 10, seriales: ["SN-0001"] }],
      monedasComprobante: ["COP"],
      observaciones: "Entrega en obra",
    });

    await usuario.click(screen.getByRole("button", { name: "Registrar otra venta" }));
    expect(await screen.findByRole("button", { name: "Elegir cliente" })).toBeVisible();
    await elegirCliente(usuario);
    await agregar(usuario, /Cable UTP/);
    await usuario.click(screen.getByRole("button", { name: "Guardar venta" }));
    await waitFor(() => {
      expect(claves).toHaveLength(2);
    });
    expect(claves[1]).not.toBe(claves[0]);
  });

  it("valida el cliente y los seriales, y muestra los errores del backend", async () => {
    servir();
    servidor.use(
      http.post("/api/v1/ventas", () =>
        problema(422, "DESCUENTO_INVALIDO", "El descuento no puede ser mayor que el subtotal."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/ventas/nueva" });
    await usuario.click(await screen.findByRole("button", { name: "Guardar venta" }));
    expect(await screen.findByText("Elige el cliente.")).toBeVisible();
    expect(screen.getByText("Agrega al menos un producto.")).toBeVisible();

    await elegirCliente(usuario);
    await agregar(usuario, /Cámara domo 2MP/);
    await usuario.click(screen.getByRole("button", { name: "Guardar venta" }));
    expect(await screen.findByText("Elige los seriales que salen.")).toBeVisible();

    await usuario.click(await screen.findByRole("button", { name: "Serial SN-0001 de Cámara domo 2MP" }));
    await usuario.click(screen.getByRole("radio", { name: "Valor" }));
    await usuario.type(screen.getByLabelText("Valor del descuento"), "500");
    await usuario.click(screen.getByRole("button", { name: "Guardar venta" }));
    expect(await screen.findByText("El descuento no puede ser mayor que el subtotal.")).toBeVisible();
    expect(screen.getByLabelText("Valor del descuento")).toHaveAttribute("aria-invalid", "true");
  });
});
