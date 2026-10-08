import { screen, waitFor, within } from "@testing-library/react";

import { hoyBogota } from "@/lib/fechas";
import type * as Imagen from "@/lib/imagen";
import { compra, HOY, pagina, producto, proveedor } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

vi.mock("@/lib/imagen", async (cargarOriginal) => {
  const original = await cargarOriginal<typeof Imagen>();
  // jsdom no dibuja en canvas: las imágenes pasan tal cual.
  return { ...original, comprimirImagen: (archivo: File) => Promise.resolve(archivo) };
});

const sinNbsp = (t: string | null) => (t ?? "").replace(/[\u00a0\u202f]/g, " ");

function servirProveedores() {
  servidor.use(
    http.get("/api/v1/proveedores", ({ response }) =>
      response(200).json(
        pagina([proveedor(), proveedor({ id: 31, nombre: "Importadora Andina", monedaHabitual: "USD" })]),
      ),
    ),
  );
}

describe("Listado de compras (RF-46, RF-47, RF-73)", () => {
  function servirListado() {
    const consultas: URLSearchParams[] = [];
    servirProveedores();
    servidor.use(
      http.get("/api/v1/compras", ({ request, response }) => {
        consultas.push(new URL(request.url).searchParams);
        return response(200).json({
          desde: "2026-10-01",
          hasta: "2026-10-31",
          totalesPorMoneda: [
            {
              compras: 1,
              total: { monto: "400000.0000", moneda: "COP" },
              totalUsd: { monto: "100.0000", moneda: "USD" },
            },
          ],
          totalUsd: { monto: "100.0000", moneda: "USD" },
          compras: pagina([
            { ...compra(), productos: "Cámara domo 2MP × 5", facturaUrl: "http://archivos.prueba/f.pdf" },
            {
              ...compra({ id: 41, consecutivo: "C-0002", estado: "ANULADA", moneda: "USD" }),
              total: { monto: "50.0000", moneda: "USD" },
            },
          ]),
        });
      }),
    );
    return consultas;
  }

  it("muestra las compras del mes con sus totales y las anuladas marcadas", async () => {
    servirListado();
    renderizarApp({ ruta: "/compras" });

    const lista = await screen.findByRole("list", { name: "Compras del período" });
    const [primera, anulada] = within(lista).getAllByRole("listitem");
    expect(primera).toHaveTextContent("C-0001 · Distribuidora Seguridad Total");
    expect(primera).toHaveTextContent("01/10/2026 · Factura FE-123 · Jose Ochoa");
    expect(primera).toHaveTextContent("Cámara domo 2MP × 5");
    expect(sinNbsp(primera!.textContent)).toContain("$ 400.000");
    expect(sinNbsp(primera!.textContent)).toContain("US$ 100,00");
    expect(within(primera!).getByRole("link", { name: /^C-0001/ })).toHaveAttribute("href", "/compras/40");
    expect(within(primera!).getByRole("link", { name: "Ver factura C-0001" })).toHaveAttribute(
      "href",
      "http://archivos.prueba/f.pdf",
    );
    expect(within(anulada!).getByText("Anulada")).toBeVisible();

    const totales = screen.getByRole("region", { name: "Totales del período" });
    expect(totales).toHaveTextContent("Del 01/10/2026 al 31/10/2026");
    expect(totales).toHaveTextContent("COP · 1 compra");
    expect(totales).toHaveTextContent("Sin las compras anuladas.");
  });

  it("filtra por proveedor, fechas, producto y anuladas", async () => {
    const consultas = servirListado();
    servidor.use(http.get("/api/v1/productos", ({ response }) => response(200).json(pagina([producto()]))));
    const { usuario, router } = renderizarApp({ ruta: "/compras" });
    await screen.findByRole("list", { name: "Compras del período" });
    expect(consultas.at(-1)?.get("incluirAnuladas")).toBe("true");

    await usuario.selectOptions(screen.getByLabelText("Proveedor"), "Importadora Andina");
    await waitFor(() => {
      expect(consultas.at(-1)?.get("proveedorId")).toBe("31");
    });
    await usuario.click(screen.getByRole("checkbox", { name: "Incluir anuladas" }));
    await waitFor(() => {
      expect(consultas.at(-1)?.get("incluirAnuladas")).toBe("false");
    });
    await usuario.click(screen.getByRole("button", { name: "Producto" }));
    await usuario.click(await screen.findByRole("button", { name: /Cámara domo 2MP/ }));
    await waitFor(() => {
      expect(consultas.at(-1)?.get("productoId")).toBe("10");
    });
    await usuario.click(screen.getByRole("button", { name: /Producto: Cámara domo 2MP/ }));
    await waitFor(() => {
      expect(router.state.location.search).toBe("?proveedor=31&anuladas=no");
    });
  });

  it("el proveedor lleva a su historial de compras (RF-38)", async () => {
    servidor.use(http.get("/api/v1/proveedores/{id}", ({ response }) => response(200).json(proveedor())));
    renderizarApp({ ruta: "/compras/proveedores/30/editar" });
    expect(await screen.findByRole("link", { name: "Ver compras" })).toHaveAttribute(
      "href",
      "/compras?proveedor=30",
    );
  });
});

describe("Registrar compra (RF-39 a RF-45)", () => {
  const camara = producto({ id: 10, stock: "4" });
  const cable = producto({
    id: 11,
    nombre: "Cable UTP",
    codigo: "CAB-UTP",
    controlaSerial: false,
    unidadMedida: { id: 2, nombre: "Metro", abreviatura: "m", admiteDecimales: true, version: 0 },
  });

  function servirFormulario() {
    servirProveedores();
    const previas: unknown[] = [];
    servidor.use(
      http.get("/api/v1/productos", ({ response }) => response(200).json(pagina([camara, cable]))),
      http.post("/api/v1/compras/vista-previa", async ({ request, response }) => {
        const cuerpo = await request.json();
        previas.push(cuerpo);
        return response(200).json({
          fecha: HOY,
          moneda: cuerpo.moneda,
          tasas: { trm: "4000", fechaTrm: HOY, tasaVes: "50", fechaTasaVes: "2026-10-05" },
          avisos: ["La tasa del bolívar es del 05/10/2026."],
          lineas: cuerpo.lineas.map((l) => ({
            productoId: l.productoId,
            nombre: l.productoId === 10 ? "Cámara domo 2MP" : "Cable UTP",
            abreviatura: l.productoId === 10 ? "und" : "m",
            cantidad: l.cantidad,
            stockActual: "4",
            costoActualUsd: { monto: "20.0000", moneda: "USD" },
            costoNuevoUsd: { monto: "19.5000", moneda: "USD" },
            regla: "PROMEDIO",
            subtotal: {
              cop: { monto: "152000.0000", moneda: "COP" },
              usd: { monto: "38.0000", moneda: "USD" },
            },
          })),
          total: { cop: { monto: "152000.0000", moneda: "COP" }, usd: { monto: "38.0000", moneda: "USD" } },
        });
      }),
    );
    return previas;
  }

  async function agregar(usuario: ReturnType<typeof renderizarApp>["usuario"], nombre: RegExp) {
    await usuario.click(screen.getByRole("button", { name: "Agregar producto" }));
    await usuario.click(await screen.findByRole("button", { name: nombre }));
  }

  it("propone la moneda del proveedor, pide la vista previa y muestra el cambio de costo y el total", async () => {
    const previas = servirFormulario();
    const { usuario } = renderizarApp({ ruta: "/compras/nueva" });

    expect(await screen.findByText("El consecutivo se asigna al guardar.")).toBeVisible();
    await screen.findByRole("option", { name: "Distribuidora Seguridad Total" });
    await usuario.selectOptions(screen.getByLabelText("Proveedor"), "Distribuidora Seguridad Total");
    expect(screen.getByText("Suele facturar en COP.")).toBeVisible();
    expect(screen.getByRole("radio", { name: "COP" })).toHaveAttribute("aria-checked", "true");

    await agregar(usuario, /Cable UTP/);
    const cantidad = screen.getByLabelText("Cantidad de Cable UTP");
    await usuario.clear(cantidad);
    await usuario.type(cantidad, "1,5");
    await usuario.type(screen.getByLabelText("Costo unitario de Cable UTP"), "2000");

    expect(await screen.findByText("Costo US$ 20,00 → US$ 19,50")).toBeVisible();
    expect(screen.getByText("promedio")).toBeVisible();
    expect(screen.getByText("Stock actual 4 m")).toBeVisible();
    expect(sinNbsp(screen.getByRole("complementary", { name: "Total de la compra" }).textContent)).toContain(
      "Total de la compra$ 152.000US$ 38,00",
    );
    expect(screen.getByText("La tasa del bolívar es del 05/10/2026.")).toBeVisible();
    expect(screen.getByText(/TRM 4\.000 \(06\/10\/2026\) · Bolívar 50 \(05\/10\/2026\)/)).toBeVisible();
    expect(previas.at(-1)).toEqual({
      moneda: "COP",
      fecha: hoyBogota(),
      lineas: [{ productoId: 11, cantidad: "1.5", costoUnitario: "2000" }],
    });
  });

  it("bloquea el guardado mientras faltan seriales y guarda con la clave de idempotencia (CP-13)", async () => {
    servirFormulario();
    let cuerpo: unknown;
    let clave: string | null = null;
    let factura: File | null = null;
    servidor.use(
      http.post("/api/v1/compras", async ({ request, response }) => {
        cuerpo = await request.json();
        clave = request.headers.get("Idempotency-Key");
        return response(201).json(compra({ id: 77, consecutivo: "C-0007" }));
      }),
      http.put("/api/v1/compras/{id}/factura", async ({ request, response }) => {
        factura = (await request.formData()).get("archivo") as File;
        return response(200).json(compra({ id: 77 }));
      }),
      http.get("/api/v1/compras/{id}", ({ response }) =>
        response(200).json(compra({ id: 77, consecutivo: "C-0007" })),
      ),
    );
    const { usuario, router } = renderizarApp({ ruta: "/compras/nueva" });

    await screen.findByRole("option", { name: "Importadora Andina" });
    await usuario.selectOptions(screen.getByLabelText("Proveedor"), "Importadora Andina");
    await usuario.type(screen.getByLabelText("N.º de factura del proveedor"), "FE-9");
    await agregar(usuario, /Cámara domo 2MP/);
    const cantidad = screen.getByLabelText("Cantidad de Cámara domo 2MP");
    await usuario.clear(cantidad);
    await usuario.type(cantidad, "2");
    await usuario.type(screen.getByLabelText("Costo unitario de Cámara domo 2MP"), "19,5");

    const guardar = screen.getByRole("button", { name: "Guardar y sumar al inventario" });
    expect(guardar).toBeDisabled();
    expect(screen.getByText("Faltan seriales en 1 producto.")).toBeVisible();

    await usuario.type(screen.getByLabelText("Serial 1 de Cámara domo 2MP"), "sn-a");
    await usuario.type(screen.getByLabelText("Serial 2 de Cámara domo 2MP"), "sn-a");
    expect(guardar).toBeDisabled();
    await usuario.clear(screen.getByLabelText("Serial 2 de Cámara domo 2MP"));
    await usuario.type(screen.getByLabelText("Serial 2 de Cámara domo 2MP"), " sn-b ");
    expect(guardar).toBeEnabled();

    await usuario.upload(
      screen.getByLabelText("Factura (foto o PDF)"),
      new File(["%PDF"], "factura.pdf", { type: "application/pdf" }),
    );
    expect(screen.getByText("factura.pdf")).toBeVisible();
    await usuario.click(guardar);

    expect(await screen.findByText("Compra C-0007 registrada")).toBeVisible();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/compras/77");
    });
    expect(cuerpo).toEqual({
      proveedorId: 31,
      numeroFactura: "FE-9",
      moneda: "USD",
      fecha: hoyBogota(),
      lineas: [{ productoId: 10, cantidad: "2", costoUnitario: "19.5", seriales: ["SN-A", "SN-B"] }],
    });
    expect(clave).toMatch(/^[0-9a-f-]{36}$/);
    expect(factura).not.toBeNull();
  });

  it("un reintento usa la misma Idempotency-Key y el botón se deshabilita mientras guarda", async () => {
    servirFormulario();
    const claves: (string | null)[] = [];
    let soltar: () => void = () => undefined;
    servidor.use(
      http.post("/api/v1/compras", async ({ request, response }) => {
        claves.push(request.headers.get("Idempotency-Key"));
        if (claves.length === 1) return problema(500, "ERROR_INTERNO", "Error interno.");
        await new Promise<void>((resolver) => {
          soltar = resolver;
        });
        return response(201).json(compra({ id: 77, consecutivo: "C-0007" }));
      }),
      http.get("/api/v1/compras/{id}", ({ response }) => response(200).json(compra({ id: 77 }))),
    );
    const { usuario } = renderizarApp({ ruta: "/compras/nueva" });

    await screen.findByRole("option", { name: "Importadora Andina" });
    await usuario.selectOptions(screen.getByLabelText("Proveedor"), "Importadora Andina");
    await usuario.type(screen.getByLabelText("N.º de factura del proveedor"), "FE-9");
    await agregar(usuario, /Cable UTP/);
    await usuario.type(screen.getByLabelText("Costo unitario de Cable UTP"), "3");
    const guardar = screen.getByRole("button", { name: "Guardar y sumar al inventario" });
    await usuario.click(guardar);
    expect(await screen.findByText(/Algo salió mal/)).toBeVisible();

    await usuario.click(guardar);
    await waitFor(() => {
      expect(guardar).toBeDisabled();
    });
    soltar();
    expect(await screen.findByText("Compra C-0007 registrada")).toBeVisible();
    expect(claves).toHaveLength(2);
    expect(claves[1]).toBe(claves[0]);
  });

  it("valida los datos y no admite decimales en unidades enteras (P-09)", async () => {
    servirFormulario();
    const { usuario } = renderizarApp({ ruta: "/compras/nueva" });
    await usuario.click(await screen.findByRole("button", { name: "Guardar y sumar al inventario" }));
    expect(await screen.findByText("Elige el proveedor.")).toBeVisible();
    expect(screen.getByText("Escribe el número de factura.")).toBeVisible();
    expect(screen.getByText("Agrega al menos un producto.")).toBeVisible();

    await agregar(usuario, /Cámara domo 2MP/);
    const cantidad = screen.getByLabelText("Cantidad de Cámara domo 2MP");
    await usuario.clear(cantidad);
    await usuario.type(cantidad, "1,5");
    await usuario.type(screen.getByLabelText("Costo unitario de Cámara domo 2MP"), "0");
    await usuario.click(screen.getByRole("button", { name: "Guardar y sumar al inventario" }));
    expect(await screen.findByText("Este valor no admite decimales.")).toBeVisible();
    expect(screen.getByText("Debe ser mayor que 0.")).toBeVisible();
  });

  it("muestra los errores del backend en su campo o como aviso general", async () => {
    servirFormulario();
    let respuesta = problema(
      422,
      "COMPRA_FECHA_FUTURA",
      "La fecha de la compra no puede ser posterior a hoy.",
    );
    servidor.use(http.post("/api/v1/compras", () => respuesta));
    const { usuario } = renderizarApp({ ruta: "/compras/nueva" });

    await screen.findByRole("option", { name: "Importadora Andina" });
    await usuario.selectOptions(screen.getByLabelText("Proveedor"), "Importadora Andina");
    await usuario.type(screen.getByLabelText("N.º de factura del proveedor"), "FE-9");
    await agregar(usuario, /Cable UTP/);
    await usuario.type(screen.getByLabelText("Costo unitario de Cable UTP"), "3");
    await usuario.click(screen.getByRole("button", { name: "Guardar y sumar al inventario" }));
    expect(await screen.findByText("La fecha de la compra no puede ser posterior a hoy.")).toBeVisible();
    expect(screen.getByLabelText("Fecha de la factura")).toHaveAttribute("aria-invalid", "true");

    respuesta = problema(409, "SERIAL_DUPLICADO", "El serial SN-1 ya existe para Cámara domo 2MP.");
    await usuario.click(screen.getByRole("button", { name: "Guardar y sumar al inventario" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El serial SN-1 ya existe para Cámara domo 2MP.",
    );
  });
});

describe("Detalle y anulación de la compra (RF-48, RF-71)", () => {
  it("muestra los datos, las líneas con su cambio de costo y los seriales", async () => {
    servidor.use(http.get("/api/v1/compras/{id}", ({ response }) => response(200).json(compra())));
    renderizarApp({ ruta: "/compras/40" });

    expect(await screen.findByRole("heading", { name: "Compra C-0001" })).toBeVisible();
    expect(screen.getByText("TRM 4.000 · Bs 50")).toBeVisible();
    const fila = within(screen.getByRole("table", { name: "Productos" })).getAllByRole("row")[1]!;
    expect(fila).toHaveTextContent("Seriales: SN-1, SN-2, SN-3, SN-4, SN-5");
    expect(sinNbsp(fila.textContent)).toContain("$ 80.000");
    expect(within(fila).getByText("sin stock")).toBeVisible();
    expect(sinNbsp(screen.getByText(/Equivale a/).textContent)).toBe("Equivale a US$ 100,00");
    expect(screen.getByText("Sin factura adjunta.")).toBeVisible();
  });

  it("anula con motivo y la compra queda visible como anulada (CP-16)", async () => {
    let motivo: unknown;
    servidor.use(
      http.get("/api/v1/compras/{id}", ({ response }) => response(200).json(compra())),
      http.post("/api/v1/compras/{id}/anular", async ({ request, response }) => {
        motivo = await request.json();
        return response(200).json(
          compra({
            estado: "ANULADA",
            anulable: false,
            anulacion: { motivo: "Factura duplicada", usuario: "Victor", fecha: "2026-10-06T14:00:00Z" },
          }),
        );
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/compras/40" });

    await usuario.click(await screen.findByRole("button", { name: "Anular" }));
    const dialogo = await screen.findByRole("dialog", { name: "¿Anular la compra C-0001?" });
    await usuario.click(within(dialogo).getByRole("button", { name: "Anular" }));
    expect(within(dialogo).getByText("Escribe el motivo.")).toBeVisible();
    await usuario.type(within(dialogo).getByLabelText("Motivo de la anulación"), "Factura duplicada");
    await usuario.click(within(dialogo).getByRole("button", { name: "Anular" }));

    expect(await screen.findByText("Compra C-0001 anulada")).toBeVisible();
    expect(motivo).toEqual({ motivo: "Factura duplicada" });
    expect(screen.getByText("Compra anulada")).toBeVisible();
    expect(screen.getByText(/Por Victor el 06\/10\/2026/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Anular" })).not.toBeInTheDocument();
  });

  it("si no se puede anular, explica por qué y cómo corregirla (CP-17)", async () => {
    servidor.use(
      http.get("/api/v1/compras/{id}", ({ response }) =>
        response(200).json(
          compra({
            anulable: false,
            motivoNoAnulable: "Cámara domo 2MP tiene movimientos posteriores a la compra.",
          }),
        ),
      ),
    );
    renderizarApp({ ruta: "/compras/40" });

    const boton = await screen.findByRole("button", { name: "Anular" });
    expect(boton).toBeDisabled();
    expect(boton).toHaveAccessibleDescription(
      "Cámara domo 2MP tiene movimientos posteriores a la compra. Para corregirla, registra un ajuste de inventario.",
    );
  });

  it("adjunta y quita la factura", async () => {
    servidor.use(
      http.get("/api/v1/compras/{id}", ({ response }) => response(200).json(compra())),
      http.put("/api/v1/compras/{id}/factura", ({ response }) =>
        response(200).json(compra({ facturaUrl: "http://archivos.prueba/f.jpg" })),
      ),
      http.delete("/api/v1/compras/{id}/factura", ({ response }) => response(200).json(compra())),
    );
    const { usuario } = renderizarApp({ ruta: "/compras/40" });

    await usuario.upload(
      await screen.findByLabelText("Adjuntar factura"),
      new File(["x"], "factura.jpg", { type: "image/jpeg" }),
    );
    expect(await screen.findByText("Factura adjuntada")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver factura" })).toHaveAttribute(
      "href",
      "http://archivos.prueba/f.jpg",
    );

    await usuario.click(screen.getByRole("button", { name: "Quitar" }));
    await usuario.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Quitar" }));
    expect(await screen.findByText("Factura quitada")).toBeVisible();
    expect(screen.getByText("Sin factura adjunta.")).toBeVisible();
  });
});
