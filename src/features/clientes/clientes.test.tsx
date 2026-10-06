import { screen, waitFor, within } from "@testing-library/react";

import { cliente, pagina } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

const sinNbsp = (t: string | null) => (t ?? "").replaceAll(" ", " ");

function sinUltimoMovimiento(c: ReturnType<typeof cliente>) {
  delete c.fechaUltimoMovimiento;
  return c;
}

function servirListado() {
  const consultas: URLSearchParams[] = [];
  servidor.use(
    http.get("/api/v1/clientes", ({ request, response }) => {
      consultas.push(new URL(request.url).searchParams);
      return response(200).json(
        pagina([
          cliente(),
          sinUltimoMovimiento(
            cliente({
              id: 21,
              nombre: "María Gómez",
              tipo: "CLIENTE_FINAL",
              ciudad: "San Cristóbal",
              telefono: "+584141234567",
              cantidadMovimientos: 0,
            }),
          ),
        ]),
      );
    }),
  );
  return consultas;
}

describe("Clientes · listado (RF-76)", () => {
  it("muestra iniciales, nombre, tipo, teléfono, ciudad y movimientos", async () => {
    servirListado();
    renderizarApp({ ruta: "/clientes" });

    expect(await screen.findByText("El tipo de cliente define el precio que se aplica")).toBeVisible();
    const [tornillo, maria] = within(await screen.findByRole("list", { name: "Clientes" })).getAllByRole(
      "listitem",
    );
    expect(tornillo).toHaveTextContent("FE");
    expect(tornillo).toHaveTextContent("Ferretería El Tornillo");
    expect(tornillo).toHaveTextContent("+573001234567 · Cúcuta");
    expect(tornillo).toHaveTextContent("Instalador");
    expect(tornillo).toHaveTextContent("2 movimientos · último 01/10/2026");
    expect(within(tornillo!).getByRole("link")).toHaveAttribute("href", "/clientes/20");
    expect(maria).toHaveTextContent("Cliente final");
    expect(maria).toHaveTextContent("Sin movimientos");
  });

  it("filtra por tipo y busca", async () => {
    const consultas = servirListado();
    const { usuario, router } = renderizarApp({ ruta: "/clientes" });

    await usuario.click(await screen.findByRole("radio", { name: "Instaladores" }));
    await waitFor(() => {
      expect(consultas.at(-1)?.get("tipo")).toBe("INSTALADOR");
    });
    await usuario.type(screen.getByRole("searchbox"), "tornillo");
    await waitFor(() => {
      expect(consultas.at(-1)?.get("buscar")).toBe("tornillo");
    });
    expect(router.state.location.search).toBe("?tipo=INSTALADOR&buscar=tornillo");
  });
});

describe("Clientes · formulario (RF-75, P-10, P-12)", () => {
  it("indica el precio que se aplicará según el tipo y crea el cliente", async () => {
    let cuerpo: unknown;
    servidor.use(
      http.post("/api/v1/clientes", async ({ request, response }) => {
        cuerpo = await request.json();
        return response(201).json(cliente({ id: 99 }));
      }),
      http.get("/api/v1/clientes/{id}", ({ response }) => response(200).json(cliente({ id: 99 }))),
      http.get("/api/v1/clientes/{id}/historial", ({ response }) =>
        response(200).json({ clienteId: 99, nombre: "x", compras: 0, instalaciones: 0, movimientos: [] }),
      ),
    );
    const { usuario, router } = renderizarApp({ ruta: "/clientes/nuevo" });

    expect(await screen.findByText("Se le aplicará el precio cliente final")).toBeVisible();
    await usuario.selectOptions(screen.getByLabelText("Tipo de cliente"), "Instalador");
    expect(screen.getByText("Se le aplicará el precio instalador")).toBeVisible();
    expect(screen.getByText(/se asume \+57 \(Colombia\)/)).toBeVisible();

    await usuario.type(screen.getByLabelText("Nombre o razón social"), "Ferretería El Tornillo");
    await usuario.selectOptions(screen.getByLabelText("Tipo de documento"), "NIT");
    await usuario.type(screen.getByLabelText("Número de documento"), "900111222-3");
    await usuario.type(screen.getByLabelText("Teléfono / WhatsApp"), "3001234567");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Cliente creado")).toBeVisible();
    expect(cuerpo).toEqual({
      tipo: "INSTALADOR",
      nombre: "Ferretería El Tornillo",
      tipoDocumento: "NIT",
      numeroDocumento: "900111222-3",
      telefono: "3001234567",
      version: 0,
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/clientes/99");
    });
  });

  it("valida nombre, teléfono y documento", async () => {
    const { usuario } = renderizarApp({ ruta: "/clientes/nuevo" });
    await usuario.type(await screen.findByLabelText("Número de documento"), "ABC");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Escribe el nombre o la razón social.")).toBeVisible();
    expect(screen.getByText("Escribe el teléfono o WhatsApp.")).toBeVisible();
    expect(screen.getByText("Solo números, puntos y guion.")).toBeVisible();
  });

  it("muestra el documento duplicado y el teléfono inválido en sus campos", async () => {
    servidor.use(
      http.post("/api/v1/clientes", () =>
        problema(409, "CLIENTE_DOCUMENTO_DUPLICADO", "Ya existe un cliente con ese documento."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/clientes/nuevo" });
    await usuario.type(await screen.findByLabelText("Nombre o razón social"), "Otro");
    await usuario.type(screen.getByLabelText("Número de documento"), "900111222-3");
    await usuario.type(screen.getByLabelText("Teléfono / WhatsApp"), "3001234567");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Ya existe un cliente con ese documento.")).toBeVisible();
    expect(screen.getByLabelText("Número de documento")).toHaveAttribute("aria-invalid", "true");

    servidor.use(
      http.post("/api/v1/clientes", () =>
        problema(400, "TELEFONO_INVALIDO", "El teléfono solo admite dígitos y +."),
      ),
    );
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("El teléfono solo admite dígitos y +.")).toBeVisible();
    expect(screen.getByLabelText("Teléfono / WhatsApp")).toHaveAttribute("aria-invalid", "true");
  });

  it("edita un cliente con su versión y sin opción de eliminar (P-11)", async () => {
    let cuerpo: Record<string, unknown> = {};
    servidor.use(
      http.get("/api/v1/clientes/{id}", ({ response }) => response(200).json(cliente())),
      http.get("/api/v1/clientes/{id}/historial", ({ response }) =>
        response(200).json({ clienteId: 20, nombre: "x", compras: 0, instalaciones: 0, movimientos: [] }),
      ),
      http.put("/api/v1/clientes/{id}", async ({ request, response }) => {
        cuerpo = await request.json();
        return response(200).json(cliente({ ciudad: "Pamplona", version: 2 }));
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/clientes/20/editar" });
    const ciudad = await screen.findByLabelText("Ciudad");
    expect(ciudad).toHaveValue("Cúcuta");
    expect(screen.queryByRole("button", { name: /Eliminar/ })).not.toBeInTheDocument();
    await usuario.clear(ciudad);
    await usuario.type(ciudad, "Pamplona");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Cliente guardado")).toBeVisible();
    expect(cuerpo).toMatchObject({ ciudad: "Pamplona", tipo: "INSTALADOR", version: 1 });
  });
});

describe("Clientes · detalle (RF-77)", () => {
  it("muestra contacto, WhatsApp, accesos a documentos, precio e historial", async () => {
    servidor.use(
      http.get("/api/v1/clientes/{id}", ({ response }) => response(200).json(cliente())),
      http.get("/api/v1/clientes/{id}/historial", ({ response }) =>
        response(200).json({
          clienteId: 20,
          nombre: "Ferretería El Tornillo",
          compras: 2,
          instalaciones: 0,
          // Campos reales del backend (D-05): el contrato los describe con otro esquema.
          movimientos: [
            {
              tipo: "VENTA",
              id: 3,
              consecutivo: "V-0003",
              fecha: "2026-10-01",
              descripcion: "Cámara domo × 1 und",
              total: { monto: "30.0000", moneda: "USD" },
              estado: "ANULADA",
            },
            {
              tipo: "VENTA",
              id: 1,
              consecutivo: "V-0001",
              fecha: "2026-09-20",
              descripcion: "Cable UTP × 50 m",
              total: { monto: "200000.0000", moneda: "COP" },
              estado: "ACTIVA",
            },
            { malformado: true },
          ] as never,
        }),
      ),
    );
    renderizarApp({ ruta: "/clientes/20" });

    expect(await screen.findByRole("heading", { level: 1, name: "Ferretería El Tornillo" })).toBeVisible();
    expect(
      screen.getByText("NIT 900111222-3 · Calle 10 # 5-20 · Cúcuta · tornillo@correo.test"),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
      "href",
      "https://wa.me/573001234567",
    );
    expect(screen.getByRole("link", { name: "Venta" })).toHaveAttribute("href", "/ventas/nueva?clienteId=20");
    expect(screen.getByRole("link", { name: "Instalación" })).toHaveAttribute(
      "href",
      "/instalaciones/nueva?clienteId=20",
    );
    expect(screen.getByRole("link", { name: "Cotización" })).toHaveAttribute(
      "href",
      "/cotizaciones/nueva?clienteId=20",
    );
    expect(screen.getByText("Se le aplicará el precio instalador")).toBeVisible();

    const historial = within(await screen.findByRole("list", { name: "Historial" })).getAllByRole("listitem");
    expect(historial).toHaveLength(2);
    expect(historial[0]).toHaveTextContent("V-0003");
    expect(historial[0]).toHaveTextContent("Anulada");
    expect(sinNbsp(historial[0]!.textContent)).toContain("US$ 30,00");
    expect(sinNbsp(historial[1]!.textContent)).toContain("$ 200.000");
    expect(historial[1]).toHaveTextContent("20/09/2026");
  });

  it("sin movimientos lo indica", async () => {
    servidor.use(
      http.get("/api/v1/clientes/{id}", ({ response }) =>
        response(200).json(cliente({ cantidadMovimientos: 0 })),
      ),
      http.get("/api/v1/clientes/{id}/historial", ({ response }) =>
        response(200).json({ clienteId: 20, nombre: "x", compras: 0, instalaciones: 0, movimientos: [] }),
      ),
    );
    renderizarApp({ ruta: "/clientes/20" });
    expect(await screen.findByText("Este cliente todavía no tiene ventas ni instalaciones.")).toBeVisible();
  });
});
