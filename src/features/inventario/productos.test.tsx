import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import type * as Imagen from "@/lib/imagen";
import { pagina, producto, productoInventario, sinCampos } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

vi.mock("@/lib/imagen", async (cargarOriginal) => {
  const original = await cargarOriginal<typeof Imagen>();
  return {
    ...original,
    // jsdom no dibuja en canvas: las imágenes válidas pasan tal cual; lo demás va a la validación real.
    comprimirImagen: (archivo: File, uso: "foto" | "logo") =>
      (original.TIPOS_IMAGEN as readonly string[]).includes(archivo.type)
        ? Promise.resolve(archivo)
        : original.comprimirImagen(archivo, uso),
  };
});

const sinNbsp = (t: string | null) => (t ?? "").replaceAll(" ", " ");

function registrarConsultas() {
  const consultas: URLSearchParams[] = [];
  servidor.use(
    http.get("/api/v1/inventario", ({ request, response }) => {
      const parametros = new URL(request.url).searchParams;
      consultas.push(parametros);
      const lista =
        parametros.get("buscar") === "nada"
          ? []
          : [
              productoInventario(),
              sinCampos(
                productoInventario({
                  id: 11,
                  nombre: "Cable UTP",
                  codigo: "CAB-UTP",
                  categoria: "Cable",
                  activo: false,
                  bajoMinimo: false,
                  controlaSerial: false,
                  abreviatura: "m",
                  stock: "120.5",
                  valorEnBodega: {},
                }),
                "marca",
                "costoActualUsd",
              ),
            ];
      return response(200).json({
        totalProductos: 25,
        valorTotal: {
          usd: { monto: "80.0000", moneda: "USD" },
          cop: { monto: "320000.0000", moneda: "COP" },
        },
        avisos: ["No hay tasa del bolívar para hoy."],
        productos: { ...pagina(lista), totalPaginas: 2, totalElementos: 25 },
      });
    }),
  );
  return consultas;
}

describe("Inventario valorizado (RF-49 a RF-52)", () => {
  it("muestra cada producto con stock, etiqueta Bajo, costo, valor en bodega y estado", async () => {
    registrarConsultas();
    renderizarApp({ ruta: "/inventario" });

    const lista = await screen.findByRole("list", { name: "Inventario" });
    const [camara, cable] = within(lista).getAllByRole("listitem");
    expect(camara).toHaveTextContent("Cámara domo 2MP");
    expect(camara).toHaveTextContent("CAM-D2 · Cámaras · Hikvision · Con serial");
    expect(camara).toHaveTextContent("4 und");
    expect(within(camara!).getByText("Bajo")).toBeVisible();
    const texto = sinNbsp(camara!.textContent);
    expect(texto).toContain("US$ 20,00");
    expect(texto).toContain("US$ 80,00");
    expect(texto).toContain("$ 320.000");
    expect(within(camara!).getByRole("link")).toHaveAttribute("href", "/inventario/productos/10");
    expect(cable).toHaveTextContent("120,5 m");
    expect(cable).toHaveTextContent("Inactivo");
    expect(sinNbsp(screen.getByText(/25 productos/).textContent)).toContain(
      "Valor del inventario: US$ 80,00 · $ 320.000",
    );
    expect(screen.getByText("No hay tasa del bolívar para hoy.")).toBeVisible();
  });

  it("filtra por estado, categoría y búsqueda, y lo guarda en la URL", async () => {
    const consultas = registrarConsultas();
    const { usuario, router } = renderizarApp({ ruta: "/inventario" });

    await screen.findByRole("list", { name: "Inventario" });
    expect(consultas.at(-1)?.get("activo")).toBe("true");

    await usuario.click(screen.getByRole("radio", { name: "Todos" }));
    await waitFor(() => {
      expect(consultas.at(-1)?.has("activo")).toBe(false);
    });

    await usuario.click(await screen.findByRole("button", { name: "Cámaras" }));
    await waitFor(() => {
      expect(consultas.at(-1)?.get("categoriaId")).toBe("1");
    });

    await usuario.type(screen.getByRole("searchbox", { name: /Buscar por nombre/ }), "SN-01");
    await waitFor(() => {
      expect(consultas.at(-1)?.get("buscar")).toBe("SN-01");
    });
    expect(router.state.location.search).toBe("?estado=todos&categoria=1&buscar=SN-01");
  });

  it("pagina el listado", async () => {
    const consultas = registrarConsultas();
    const { usuario } = renderizarApp({ ruta: "/inventario" });

    await usuario.click(await screen.findByRole("button", { name: "Siguiente" }));
    await waitFor(() => {
      expect(consultas.at(-1)?.get("page")).toBe("1");
    });
    expect(screen.getByText("Página 2 de 2")).toBeVisible();
  });

  it("indica cuando no hay resultados", async () => {
    registrarConsultas();
    renderizarApp({ ruta: "/inventario?buscar=nada" });
    expect(await screen.findByText("No hay productos con estos filtros.")).toBeVisible();
  });
});

describe("Nuevo producto (RF-14, RF-16)", () => {
  async function llenar(usuario: ReturnType<typeof renderizarApp>["usuario"]) {
    await usuario.type(await screen.findByLabelText("Código"), "cam-d2");
    await usuario.type(screen.getByLabelText("Nombre"), "Cámara domo 2MP");
    await usuario.selectOptions(
      screen.getByLabelText("Categoría"),
      await screen.findByRole("option", { name: "Cámaras" }),
    );
    await usuario.selectOptions(screen.getByLabelText("Unidad de medida"), "Unidad (und)");
    await usuario.click(screen.getByRole("checkbox", { name: /Controla serial/ }));
    await usuario.type(screen.getByLabelText("Precio instalador"), "25,5");
    await usuario.type(screen.getByLabelText("Precio cliente final"), "32");
  }

  it("crea el producto con los decimales como texto y lleva a editarlo para la foto", async () => {
    let cuerpo: unknown;
    servidor.use(
      http.post("/api/v1/productos", async ({ request, response }) => {
        cuerpo = await request.json();
        return response(201).json(producto({ id: 77 }));
      }),
      http.get("/api/v1/productos/{id}", ({ response }) => response(200).json(producto({ id: 77 }))),
    );
    const { usuario, router } = renderizarApp({ ruta: "/inventario/productos/nuevo" });

    expect(await screen.findByText("Podrás agregar la foto después de crear el producto.")).toBeVisible();
    await llenar(usuario);
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Producto creado")).toBeVisible();
    expect(cuerpo).toEqual({
      codigo: "cam-d2",
      nombre: "Cámara domo 2MP",
      categoriaId: 1,
      unidadMedidaId: 1,
      controlaSerial: true,
      monedaPrecio: "USD",
      precioInstalador: "25.5",
      precioClienteFinal: "32",
      version: 0,
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/inventario/productos/77/editar");
    });
  });

  it("valida los campos obligatorios", async () => {
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/nuevo" });
    await usuario.click(await screen.findByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Escribe el código.")).toBeVisible();
    expect(screen.getByText("Escribe el nombre.")).toBeVisible();
    expect(screen.getByText("Elige la categoría.")).toBeVisible();
    expect(screen.getByText("Elige la unidad de medida.")).toBeVisible();
    expect(screen.getAllByText("Escribe el precio.")).toHaveLength(2);
  });

  it("el stock mínimo admite decimales solo si la unidad los admite (P-09)", async () => {
    let cuerpo: Record<string, unknown> = {};
    servidor.use(
      http.post("/api/v1/productos", async ({ request, response }) => {
        cuerpo = await request.json();
        return response(201).json(producto());
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/nuevo" });
    await llenar(usuario);
    await usuario.type(screen.getByLabelText("Stock mínimo"), "2,5");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Este valor no admite decimales.")).toBeVisible();

    await usuario.selectOptions(screen.getByLabelText("Unidad de medida"), "Metro (m)");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Producto creado")).toBeVisible();
    expect(cuerpo.stockMinimo).toBe("2.5");
    expect(cuerpo.unidadMedidaId).toBe(2);
  });

  it("muestra el código duplicado en su campo", async () => {
    servidor.use(
      http.post("/api/v1/productos", () =>
        problema(409, "PRODUCTO_CODIGO_DUPLICADO", "Ya existe un producto con el código CAM-D2."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/nuevo" });
    await llenar(usuario);
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Ya existe un producto con el código CAM-D2.")).toBeVisible();
    expect(screen.getByLabelText("Código")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Editar producto (RF-14, P-17)", () => {
  function servirProducto(...versiones: ReturnType<typeof producto>[]) {
    let i = 0;
    servidor.use(
      http.get("/api/v1/productos/{id}", ({ response }) =>
        response(200).json(versiones[Math.min(i++, versiones.length - 1)]!),
      ),
    );
  }

  it("carga los datos con coma decimal y guarda con la versión", async () => {
    servirProducto(producto());
    let cuerpo: Record<string, unknown> = {};
    servidor.use(
      http.put("/api/v1/productos/{id}", async ({ request, response }) => {
        cuerpo = await request.json();
        return response(200).json(producto({ version: 3 }));
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/10/editar" });

    const precio = await screen.findByLabelText("Precio instalador");
    expect(precio).toHaveValue("25,5");
    expect(screen.getByLabelText("Stock mínimo")).toHaveValue("5");
    expect(screen.getByText("Sin costo todavía: se calcula con la primera compra.")).toBeVisible();
    await usuario.clear(precio);
    await usuario.type(precio, "26");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Producto guardado")).toBeVisible();
    expect(cuerpo).toMatchObject({
      precioInstalador: "26",
      stockMinimo: "5",
      marca: "Hikvision",
      version: 2,
    });
  });

  it("si otro usuario lo modificó, carga los datos actuales y avisa (BP-12)", async () => {
    servirProducto(producto(), producto({ nombre: "Cámara domo 2MP v2", version: 5 }));
    servidor.use(
      http.put("/api/v1/productos/{id}", () =>
        problema(409, "MODIFICADO_POR_OTRO_USUARIO", "Otro usuario modificó el producto."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/10/editar" });
    await usuario.type(await screen.findByLabelText("Marca"), " X");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText(/Otro usuario modificó este registro/)).toBeVisible();
    await waitFor(() => {
      expect(screen.getByLabelText("Nombre")).toHaveValue("Cámara domo 2MP v2");
    });
    expect(screen.getByLabelText("Marca")).toHaveValue("Hikvision");
  });

  it("si ya tiene movimientos, el cambio de unidad se rechaza en ese campo (P-17)", async () => {
    servirProducto(producto());
    servidor.use(
      http.put("/api/v1/productos/{id}", () =>
        problema(
          422,
          "PRODUCTO_CAMBIO_NO_PERMITIDO",
          "No se puede cambiar la unidad de medida del producto: ya tiene movimientos.",
        ),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/10/editar" });
    await screen.findByRole("option", { name: "Metro (m)" });
    await usuario.selectOptions(screen.getByLabelText("Unidad de medida"), "Metro (m)");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText(/No se puede cambiar la unidad de medida/)).toBeVisible();
    expect(screen.getByLabelText("Unidad de medida")).toHaveAttribute("aria-invalid", "true");
  });

  it("desactiva y activa el producto", async () => {
    servirProducto(producto());
    servidor.use(
      http.post("/api/v1/productos/{id}/desactivar", ({ response }) =>
        response(200).json(producto({ activo: false })),
      ),
      http.post("/api/v1/productos/{id}/activar", ({ response }) =>
        response(200).json(producto({ activo: true })),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/10/editar" });

    await usuario.click(await screen.findByRole("button", { name: "Desactivar" }));
    expect(await screen.findByText("Producto desactivado")).toBeVisible();
    expect(screen.getByText(/Este producto está inactivo/)).toBeVisible();

    await usuario.click(screen.getByRole("button", { name: "Activar" }));
    expect(await screen.findByText("Producto activado")).toBeVisible();
  });

  it("con movimientos no se elimina y ofrece desactivarlo", async () => {
    servirProducto(producto());
    let desactivado = false;
    servidor.use(
      http.delete("/api/v1/productos/{id}", () =>
        problema(
          422,
          "PRODUCTO_CON_MOVIMIENTOS",
          "El producto tiene movimientos y no se puede eliminar; puedes desactivarlo.",
        ),
      ),
      http.post("/api/v1/productos/{id}/desactivar", ({ response }) => {
        desactivado = true;
        return response(200).json(producto({ activo: false }));
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/10/editar" });
    await usuario.click(await screen.findByRole("button", { name: "Eliminar" }));
    const dialogo = await screen.findByRole("dialog", { name: "¿Eliminar «Cámara domo 2MP»?" });
    await usuario.click(within(dialogo).getByRole("button", { name: "Eliminar" }));

    expect(await within(dialogo).findByText(/tiene movimientos y no se puede eliminar/)).toBeVisible();
    await usuario.click(within(dialogo).getByRole("button", { name: "Desactivar" }));
    expect(await screen.findByText("Producto desactivado")).toBeVisible();
    expect(desactivado).toBe(true);
  });

  it("elimina un producto sin movimientos y vuelve al inventario", async () => {
    servirProducto(producto());
    registrarConsultas();
    servidor.use(http.delete("/api/v1/productos/{id}", ({ response }) => response(204).empty()));
    const { usuario, router } = renderizarApp({ ruta: "/inventario/productos/10/editar" });
    await usuario.click(await screen.findByRole("button", { name: "Eliminar" }));
    await usuario.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText("Producto eliminado")).toBeVisible();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/inventario");
    });
  });

  it("sube la foto del producto", async () => {
    servirProducto(producto());
    servidor.use(
      http.put("/api/v1/productos/{id}/foto", ({ response }) =>
        response(200).json(producto({ fotoUrl: "http://archivos.prueba/cam.webp?firma=1" })),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/10/editar" });
    await usuario.upload(
      await screen.findByLabelText("Foto del producto"),
      new File(["x"], "cam.jpg", { type: "image/jpeg" }),
    );
    expect(await screen.findByRole("img", { name: "Foto del producto" })).toHaveAttribute(
      "src",
      "http://archivos.prueba/cam.webp?firma=1",
    );
  });

  it("rechaza en el navegador archivos que no son imagen (P-16)", async () => {
    servirProducto(producto());
    renderizarApp({ ruta: "/inventario/productos/10/editar" });
    // El selector de archivos permite elegir "Todos los archivos": se simula ese caso.
    fireEvent.change(await screen.findByLabelText("Foto del producto"), {
      target: { files: [new File(["%PDF"], "factura.pdf", { type: "application/pdf" })] },
    });
    expect(await screen.findByText("Elige una imagen JPEG, PNG o WebP.")).toBeVisible();
  });
});
