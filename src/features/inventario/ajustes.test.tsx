import { screen, waitFor, within } from "@testing-library/react";

import type * as Componentes from "@/api/esquema";
import { pagina, producto, productoDetalle, serial, sinCampos } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

type Ajuste = Componentes.components["schemas"]["AjusteVista"];

function ajuste(cambios: Partial<Ajuste> = {}): Ajuste {
  return {
    id: 7,
    consecutivo: "AJ-001",
    fecha: "2026-10-06",
    tipo: "ENTRADA",
    motivo: "CONTEO_FISICO",
    motivoEtiqueta: "Conteo físico",
    producto: { id: 10, codigo: "CAM-D2", nombre: "Cámara domo 2MP" },
    cantidad: "2",
    abreviatura: "und",
    costoUnitarioUsd: { monto: "20.0000", moneda: "USD" },
    valorUsd: { monto: "40.0000", moneda: "USD" },
    seriales: ["SN-A", "SN-B"],
    registradoPor: "Jose Ochoa",
    registradoEn: "2026-10-06T15:00:00Z",
    ...cambios,
  };
}

function servirProducto(detalle = productoDetalle(), catalogo = producto()) {
  let cuerpo: Record<string, unknown> | undefined;
  let clave: string | null = null;
  servidor.use(
    http.get("/api/v1/inventario/productos/{id}", ({ response }) => response(200).json(detalle)),
    http.get("/api/v1/productos/{id}", ({ response }) => response(200).json(catalogo)),
    http.get("/api/v1/inventario/productos/{id}/seriales", ({ response }) =>
      response(200).json([serial(), serial({ id: 501, numero: "SN-0002" })]),
    ),
    http.post("/api/v1/ajustes", async ({ request, response }) => {
      cuerpo = await request.json();
      clave = request.headers.get("Idempotency-Key");
      return response(201).json(ajuste());
    }),
    http.get("/api/v1/ajustes/{id}", ({ response }) => response(200).json(ajuste())),
  );
  return {
    cuerpo: () => cuerpo,
    clave: () => clave,
  };
}

describe("Ajuste de inventario (RF-58 a RF-62)", () => {
  it("entrada con seriales al costo vigente (CP-19), con vista previa del stock", async () => {
    const enviado = servirProducto();
    const { usuario, router } = renderizarApp({ ruta: "/inventario/productos/10/ajuste" });

    expect(await screen.findByRole("heading", { name: "Ajustar inventario" })).toBeVisible();
    expect(screen.getByText(/Entra al costo vigente \(US\$\s20,00\) y no lo cambia/)).toBeVisible();
    expect(screen.queryByLabelText("Costo unitario en USD")).not.toBeInTheDocument();

    await usuario.type(screen.getByLabelText("Cantidad"), "2");
    expect(screen.getByText("Stock 4 und → 6 und")).toBeVisible();
    await usuario.type(screen.getByLabelText("Serial 1 de Cámara domo 2MP"), "sn-a");
    await usuario.type(screen.getByLabelText("Serial 2 de Cámara domo 2MP"), "sn-b");
    await usuario.click(screen.getByRole("button", { name: "Guardar ajuste" }));

    expect(await screen.findByText("Ajuste AJ-001 registrado")).toBeVisible();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/inventario/ajustes/7");
    });
    expect(enviado.cuerpo()).toEqual({
      productoId: 10,
      motivo: "CONTEO_FISICO",
      cantidad: "2",
      seriales: ["SN-A", "SN-B"],
    });
    expect(enviado.clave()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("salida con serial: se eligen los seriales en bodega y la cantidad va negativa", async () => {
    const enviado = servirProducto();
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/10/ajuste" });

    await usuario.click(await screen.findByRole("radio", { name: "Salida" }));
    await usuario.selectOptions(screen.getByLabelText("Motivo"), "Daño");
    expect(screen.queryByLabelText("Cantidad")).not.toBeInTheDocument();
    await usuario.click(await screen.findByRole("checkbox", { name: "SN-0002" }));
    expect(screen.getByText("Stock 4 und → 3 und")).toBeVisible();
    await usuario.click(screen.getByRole("button", { name: "Guardar ajuste" }));

    await screen.findByText("Ajuste AJ-001 registrado");
    expect(enviado.cuerpo()).toEqual({
      productoId: 10,
      motivo: "DANO",
      cantidad: "-1",
      seriales: ["SN-0002"],
    });
  });

  it("una salida mayor que el stock bloquea el guardado (RF-62)", async () => {
    servirProducto(productoDetalle({ controlaSerial: false }));
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/10/ajuste" });

    await usuario.click(await screen.findByRole("radio", { name: "Salida" }));
    await usuario.type(screen.getByLabelText("Cantidad"), "5");
    expect(screen.getByText("Stock insuficiente · quedan 4 und")).toBeVisible();
    expect(screen.getByRole("button", { name: "Guardar ajuste" })).toBeDisabled();
  });

  it("una entrada en un producto sin costo pide el costo en USD (P-25) y Otro exige descripción", async () => {
    const enviado = servirProducto(
      sinCampos(productoDetalle({ controlaSerial: false, stock: "0" }), "costoActual"),
      producto({
        unidadMedida: { id: 2, nombre: "Metro", abreviatura: "m", admiteDecimales: true, version: 0 },
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/10/ajuste" });

    await usuario.selectOptions(await screen.findByLabelText("Motivo"), "Otro");
    await usuario.type(screen.getByLabelText("Cantidad"), "2,5");
    await usuario.click(screen.getByRole("button", { name: "Guardar ajuste" }));
    expect(await screen.findByText("Escribe la descripción.")).toBeVisible();
    expect(screen.getByText("Escribe el costo unitario en USD.")).toBeVisible();

    await usuario.type(screen.getByLabelText("Descripción"), "Sobrante de obra");
    await usuario.type(screen.getByLabelText("Costo unitario en USD"), "1,2");
    await usuario.click(screen.getByRole("button", { name: "Guardar ajuste" }));
    await screen.findByText("Ajuste AJ-001 registrado");
    expect(enviado.cuerpo()).toEqual({
      productoId: 10,
      motivo: "OTRO",
      descripcion: "Sobrante de obra",
      cantidad: "2.5",
      costoUnitarioUsd: "1.2",
    });
  });

  it("muestra en su campo el error del backend", async () => {
    servirProducto(productoDetalle({ controlaSerial: false }));
    servidor.use(
      http.post("/api/v1/ajustes", () =>
        problema(422, "STOCK_INSUFICIENTE", "Stock insuficiente · quedan 3 und"),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/10/ajuste" });
    await usuario.click(await screen.findByRole("radio", { name: "Salida" }));
    await usuario.type(screen.getByLabelText("Cantidad"), "4");
    await usuario.click(screen.getByRole("button", { name: "Guardar ajuste" }));

    expect(await screen.findByText("Stock insuficiente · quedan 3 und")).toBeVisible();
    expect(screen.getByLabelText("Cantidad")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Ajustes: listado y detalle", () => {
  it("lista los ajustes y filtra por fechas", async () => {
    const consultas: URLSearchParams[] = [];
    servidor.use(
      http.get("/api/v1/ajustes", ({ request, response }) => {
        consultas.push(new URL(request.url).searchParams);
        return response(200).json(
          pagina([ajuste(), ajuste({ id: 8, consecutivo: "AJ-002", tipo: "SALIDA" })]),
        );
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/inventario/ajustes" });

    const lista = await screen.findByRole("list", { name: "Ajustes" });
    const [primero, segundo] = within(lista).getAllByRole("listitem");
    expect(primero).toHaveTextContent("AJ-001 · Cámara domo 2MP");
    expect(primero).toHaveTextContent("06/10/2026 · Conteo físico · Jose Ochoa");
    expect(within(primero!).getByRole("link")).toHaveAttribute("href", "/inventario/ajustes/7");
    expect(segundo).toHaveTextContent("Salida");

    await usuario.type(screen.getByLabelText("Desde"), "2026-10-01");
    await waitFor(() => {
      expect(consultas.at(-1)?.get("desde")).toBe("2026-10-01");
    });
  });

  it("muestra el detalle y que no se anula (P-24)", async () => {
    servirProducto();
    renderizarApp({ ruta: "/inventario/ajustes/7" });

    expect(await screen.findByRole("heading", { name: "Ajuste AJ-001" })).toBeVisible();
    expect(screen.getByRole("link", { name: "CAM-D2 · Cámara domo 2MP" })).toHaveAttribute(
      "href",
      "/inventario/productos/10",
    );
    expect(screen.getByText("SN-A, SN-B")).toBeVisible();
    expect(screen.getByText(/no se editan ni se anulan/)).toBeVisible();
  });
});
