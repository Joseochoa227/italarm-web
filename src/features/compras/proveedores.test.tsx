import { screen, waitFor, within } from "@testing-library/react";

import { pagina, proveedor } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

describe("Proveedores (RF-37, W-01)", () => {
  it("están en la pestaña Proveedores de Compras, con moneda, NIT, ciudad y teléfono", async () => {
    const consultas: URLSearchParams[] = [];
    servidor.use(
      http.get("/api/v1/proveedores", ({ request, response }) => {
        consultas.push(new URL(request.url).searchParams);
        return response(200).json(pagina([proveedor()]));
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/compras" });

    expect(await screen.findByText("Esta sección llega en la Fase 2")).toBeVisible();
    await usuario.click(screen.getByRole("link", { name: "Proveedores" }));

    const [fila] = within(await screen.findByRole("list", { name: "Proveedores" })).getAllByRole("listitem");
    expect(fila).toHaveTextContent("Distribuidora Seguridad Total");
    expect(fila).toHaveTextContent("NIT 800555444-1 · Bogotá · +573109998877");
    expect(fila).toHaveTextContent("COP");

    await usuario.type(screen.getByRole("searchbox"), "total");
    await waitFor(() => {
      expect(consultas.at(-1)?.get("buscar")).toBe("total");
    });
  });

  it("crea un proveedor con su moneda habitual", async () => {
    let cuerpo: unknown;
    servidor.use(
      http.post("/api/v1/proveedores", async ({ request, response }) => {
        cuerpo = await request.json();
        return response(201).json(proveedor());
      }),
      http.get("/api/v1/proveedores", ({ response }) => response(200).json(pagina([proveedor()]))),
    );
    const { usuario, router } = renderizarApp({ ruta: "/compras/proveedores/nuevo" });

    await usuario.type(
      await screen.findByLabelText("Nombre o razón social"),
      "Distribuidora Seguridad Total",
    );
    await usuario.type(screen.getByLabelText("NIT o documento"), "800555444-1");
    await usuario.selectOptions(screen.getByLabelText("Moneda habitual"), "COP · pesos");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Proveedor creado")).toBeVisible();
    expect(cuerpo).toEqual({
      nombre: "Distribuidora Seguridad Total",
      nit: "800555444-1",
      monedaHabitual: "COP",
      version: 0,
    });
    expect(router.state.location.search).toBe("?pestana=proveedores");
  });

  it("edita un proveedor y maneja el conflicto de versión", async () => {
    let version = 0;
    servidor.use(
      http.get("/api/v1/proveedores/{id}", ({ response }) =>
        response(200).json(proveedor({ version, ciudad: version ? "Medellín" : "Bogotá" })),
      ),
      http.put("/api/v1/proveedores/{id}", () => {
        version = 1;
        return problema(409, "MODIFICADO_POR_OTRO_USUARIO", "Otro usuario modificó el proveedor.");
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/compras/proveedores/30/editar" });
    await usuario.type(await screen.findByLabelText("Teléfono"), "1");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText(/Otro usuario modificó este registro/)).toBeVisible();
    await waitFor(() => {
      expect(screen.getByLabelText("Ciudad")).toHaveValue("Medellín");
    });
    expect(screen.queryByRole("button", { name: /Eliminar/ })).not.toBeInTheDocument();
  });

  it("valida el NIT y el correo", async () => {
    const { usuario } = renderizarApp({ ruta: "/compras/proveedores/nuevo" });
    await usuario.type(await screen.findByLabelText("Nombre o razón social"), "X");
    await usuario.type(screen.getByLabelText("NIT o documento"), "abc");
    await usuario.type(screen.getByLabelText("Correo"), "no-es-correo");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Solo números, puntos y guion.")).toBeVisible();
    expect(screen.getByText("Escribe un correo válido.")).toBeVisible();
  });
});
