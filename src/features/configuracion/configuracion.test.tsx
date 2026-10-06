import { screen, waitFor, within } from "@testing-library/react";

import type * as Imagen from "@/lib/imagen";

import { configuracion } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

vi.mock("@/lib/imagen", async (original) => ({
  ...(await original<typeof Imagen>()),
  // jsdom no dibuja en canvas: la compresión se prueba aparte (imagen.test.ts).
  comprimirImagen: (archivo: File) => Promise.resolve(archivo),
}));

describe("Configuración · Empresa (RF-145)", () => {
  it("muestra los datos actuales y guarda la pestaña con la versión", async () => {
    let cuerpo: unknown;
    servidor.use(
      http.put("/api/v1/configuracion", async ({ request, response }) => {
        cuerpo = await request.json();
        const guardada = configuracion({ version: 4 });
        delete guardada.empresaLema;
        return response(200).json(guardada);
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion" });

    const lema = await screen.findByLabelText("Lema");
    expect(lema).toHaveValue("Seguridad que se ve");
    expect(screen.getByRole("link", { name: "Empresa" })).toHaveAttribute("aria-current", "page");
    await usuario.clear(lema);
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Configuración guardada")).toBeVisible();
    expect(cuerpo).toEqual({
      empresaNombre: "ITALARM",
      empresaNit: "900123456-7",
      empresaCiudad: "Cúcuta",
      empresaTelefono: "+573001234567",
      empresaCorreo: "contacto@italarm.test",
      validezCotizacionDias: 15,
      garantiaManoObraMeses: 3,
      garantiaEquiposMeses: 3,
      limiteVariacionTasa: "5.00",
      condicionesGarantia: "La garantía no cubre daños por mal uso.",
      piePdf: "Gracias por su compra.",
      version: 3,
    });
  });

  it("si otro usuario la modificó, recarga los datos actuales y avisa (BP-12)", async () => {
    let version = 3;
    servidor.use(
      http.get("/api/v1/configuracion", ({ response }) =>
        response(200).json(configuracion({ version, empresaCiudad: version === 3 ? "Cúcuta" : "Bogotá" })),
      ),
      http.put("/api/v1/configuracion", () => {
        version = 4;
        return problema(409, "MODIFICADO_POR_OTRO_USUARIO", "Otro usuario modificó la configuración.");
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion" });

    await usuario.type(await screen.findByLabelText("NIT"), "0");
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText(/Otro usuario modificó este registro/)).toBeVisible();
    await waitFor(() => {
      expect(screen.getByLabelText("Ciudad")).toHaveValue("Bogotá");
    });
    expect(screen.getByLabelText("NIT")).toHaveValue("900123456-7");
  });

  it("valida el nombre y el correo junto al campo", async () => {
    const { usuario } = renderizarApp({ ruta: "/configuracion" });
    await usuario.clear(await screen.findByLabelText("Nombre de la empresa"));
    await usuario.clear(screen.getByLabelText("Correo"));
    await usuario.type(screen.getByLabelText("Correo"), "no-es-correo");
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Escribe el nombre de la empresa.")).toBeVisible();
    expect(screen.getByText("Escribe un correo válido.")).toBeVisible();
  });

  it("sube y quita el logo (guía §6)", async () => {
    let tipoContenido = "";
    servidor.use(
      http.put("/api/v1/configuracion/logo", ({ request, response }) => {
        tipoContenido = request.headers.get("Content-Type") ?? "";
        return response(200).json(configuracion({ logoUrl: "http://archivos.prueba/logo.webp?firma=1" }));
      }),
      http.delete("/api/v1/configuracion/logo", ({ response }) => response(200).json(configuracion())),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion" });

    const entrada = await screen.findByLabelText("Logo para los PDF");
    await usuario.upload(entrada, new File(["png"], "logo.png", { type: "image/png" }));

    expect(await screen.findByRole("img", { name: "Logo para los PDF" })).toHaveAttribute(
      "src",
      "http://archivos.prueba/logo.webp?firma=1",
    );
    expect(tipoContenido).toMatch(/^multipart\/form-data/);

    await usuario.click(screen.getByRole("button", { name: "Quitar" }));
    expect(await screen.findByLabelText("Sin imagen")).toBeVisible();
  });

  it("muestra el error del backend si el archivo no es una imagen real", async () => {
    servidor.use(
      http.put("/api/v1/configuracion/logo", () =>
        problema(400, "ARCHIVO_TIPO_NO_PERMITIDO", "El archivo no es una imagen JPEG, PNG o WebP."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion" });
    await usuario.upload(
      await screen.findByLabelText("Logo para los PDF"),
      new File(["x"], "falso.png", { type: "image/png" }),
    );
    expect(await screen.findByText("El archivo no es una imagen JPEG, PNG o WebP.")).toBeVisible();
  });
});

describe("Configuración · Valores por defecto (RF-146, RF-147)", () => {
  it("guarda validez, garantías y límite con coma decimal", async () => {
    let cuerpo: Record<string, unknown> = {};
    servidor.use(
      http.put("/api/v1/configuracion", async ({ request, response }) => {
        cuerpo = await request.json();
        return response(200).json(configuracion());
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion?pestana=valores" });

    await usuario.selectOptions(await screen.findByLabelText("Validez de las cotizaciones"), "30 días");
    await usuario.selectOptions(screen.getByLabelText("Garantía de mano de obra"), "1 mes");
    const limite = screen.getByLabelText("Límite de variación de tasas (%)");
    expect(limite).toHaveValue("5");
    await usuario.clear(limite);
    await usuario.type(limite, "7,5");
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Configuración guardada")).toBeVisible();
    expect(cuerpo).toMatchObject({
      validezCotizacionDias: 30,
      garantiaManoObraMeses: 1,
      garantiaEquiposMeses: 3,
      limiteVariacionTasa: "7.5",
      empresaLema: "Seguridad que se ve",
      version: 3,
    });
  });

  it("valida el límite de variación", async () => {
    const { usuario } = renderizarApp({ ruta: "/configuracion?pestana=valores" });
    const limite = await screen.findByLabelText("Límite de variación de tasas (%)");
    await usuario.clear(limite);
    await usuario.type(limite, "150");
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("El límite debe ser mayor que 0 y máximo 100.")).toBeVisible();

    await usuario.clear(limite);
    await usuario.type(limite, "5,555");
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Admite máximo 2 decimales.")).toBeVisible();
  });
});

describe("Configuración · Categorías y unidades (RF-15, RF-148)", () => {
  it("lista las categorías y crea una nueva", async () => {
    let cuerpo: unknown;
    servidor.use(
      http.post("/api/v1/categorias", async ({ request, response }) => {
        cuerpo = await request.json();
        return response(201).json({ id: 9, nombre: "Discos duros", cantidadProductos: 0, version: 0 });
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion?pestana=categorias" });

    const lista = await screen.findByRole("list", { name: "Categorías" });
    expect(within(lista).getAllByRole("listitem")[0]).toHaveTextContent("Cámaras3 productos");

    await usuario.click(screen.getByRole("button", { name: "Nueva categoría" }));
    const dialogo = await screen.findByRole("dialog", { name: "Nueva categoría" });
    await usuario.type(within(dialogo).getByLabelText("Nombre de la categoría"), "  Discos duros ");
    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Categoría creada")).toBeVisible();
    expect(cuerpo).toEqual({ nombre: "Discos duros", version: 0 });
  });

  it("muestra el nombre duplicado en el campo", async () => {
    servidor.use(
      http.put("/api/v1/categorias/{id}", () =>
        problema(409, "CATEGORIA_DUPLICADA", "Ya existe una categoría con ese nombre."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion?pestana=categorias" });
    await usuario.click(await screen.findByRole("button", { name: "Renombrar Cable" }));
    const dialogo = await screen.findByRole("dialog", { name: "Renombrar categoría" });
    const campo = within(dialogo).getByLabelText("Nombre de la categoría");
    expect(campo).toHaveValue("Cable");
    await usuario.clear(campo);
    await usuario.type(campo, "Cámaras");
    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar" }));

    expect(await within(dialogo).findByText("Ya existe una categoría con ese nombre.")).toBeVisible();
    expect(campo).toHaveAttribute("aria-invalid", "true");
  });

  it("no elimina una categoría con productos y lo explica", async () => {
    servidor.use(
      http.delete("/api/v1/categorias/{id}", () =>
        problema(422, "CATEGORIA_CON_PRODUCTOS", "La categoría tiene productos y no se puede eliminar."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion?pestana=categorias" });
    await usuario.click(await screen.findByRole("button", { name: "Eliminar Cámaras" }));
    const dialogo = await screen.findByRole("dialog", { name: "¿Eliminar la categoría «Cámaras»?" });
    await usuario.click(within(dialogo).getByRole("button", { name: "Eliminar" }));

    expect(
      await within(dialogo).findByText("La categoría tiene productos y no se puede eliminar."),
    ).toBeVisible();
  });

  it("elimina una categoría sin productos", async () => {
    let eliminada = "";
    servidor.use(
      http.delete("/api/v1/categorias/{id}", ({ params, response }) => {
        eliminada = params.id;
        return response(204).empty();
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion?pestana=categorias" });
    await usuario.click(await screen.findByRole("button", { name: "Eliminar Cable" }));
    await usuario.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText("Categoría eliminada")).toBeVisible();
    expect(eliminada).toBe("2");
  });

  it("crea una unidad que admite decimales (P-09) y edita otra", async () => {
    const cuerpos: unknown[] = [];
    servidor.use(
      http.post("/api/v1/unidades-medida", async ({ request, response }) => {
        cuerpos.push(await request.json());
        return response(201).json({
          id: 5,
          nombre: "Rollo",
          abreviatura: "rl",
          admiteDecimales: true,
          version: 0,
        });
      }),
      http.put("/api/v1/unidades-medida/{id}", async ({ request, response }) => {
        cuerpos.push(await request.json());
        return response(200).json({
          id: 1,
          nombre: "Unidad",
          abreviatura: "u",
          admiteDecimales: false,
          version: 1,
        });
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion?pestana=unidades" });

    expect(await screen.findByText("m · Admite decimales")).toBeVisible();
    await usuario.click(screen.getByRole("button", { name: "Nueva unidad" }));
    let dialogo = await screen.findByRole("dialog", { name: "Nueva unidad de medida" });
    await usuario.type(within(dialogo).getByLabelText("Nombre"), "Rollo");
    await usuario.type(within(dialogo).getByLabelText("Abreviatura"), "rl");
    await usuario.click(within(dialogo).getByRole("checkbox", { name: /Admite cantidades con decimales/ }));
    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Unidad creada")).toBeVisible();

    await usuario.click(screen.getByRole("button", { name: "Editar Unidad" }));
    dialogo = await screen.findByRole("dialog", { name: "Editar unidad de medida" });
    await usuario.clear(within(dialogo).getByLabelText("Abreviatura"));
    await usuario.type(within(dialogo).getByLabelText("Abreviatura"), "u");
    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Unidad actualizada")).toBeVisible();

    expect(cuerpos).toEqual([
      { nombre: "Rollo", abreviatura: "rl", admiteDecimales: true, version: 0 },
      { nombre: "Unidad", abreviatura: "u", admiteDecimales: false, version: 0 },
    ]);
  });

  it("explica por qué no elimina una unidad en uso", async () => {
    servidor.use(
      http.delete("/api/v1/unidades-medida/{id}", () =>
        problema(422, "UNIDAD_EN_USO", "La unidad está en uso por productos."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion?pestana=unidades" });
    await usuario.click(await screen.findByRole("button", { name: "Eliminar Metro" }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Eliminar" }));
    expect(await within(dialogo).findByText("La unidad está en uso por productos.")).toBeVisible();
  });
});
