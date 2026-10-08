import { screen, within } from "@testing-library/react";

import { renderizarApp } from "@/test/renderizar";
import { HttpResponse } from "msw";

import { http, problema, servidor } from "@/test/servidor";

const xlsx = (nombre = "carga.xlsx") =>
  new File(["PK"], nombre, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

const CARGA = {
  id: 1,
  consecutivo: "II-001",
  fecha: "2026-10-06",
  registradaPor: "Jose Ochoa",
  archivo: "carga.xlsx",
  productosCreados: 12,
  clientesCreados: 3,
  proveedoresCreados: 2,
  productosConStock: 10,
  valorUsd: { monto: "1500.0000", moneda: "USD" as const },
};

describe("Carga inicial desde Excel (3.18)", () => {
  it("valida, muestra el resumen y confirma con el mismo archivo y la clave (CP-28)", async () => {
    let validado: FormDataEntryValue | null = null;
    let cargado: FormDataEntryValue | null = null;
    let clave: string | null = null;
    let cargas: (typeof CARGA)[] = [];
    servidor.use(
      http.get("/api/v1/carga-inicial", ({ response }) => response(200).json(cargas)),
      http.post("/api/v1/carga-inicial/validar", async ({ request, response }) => {
        validado = (await request.formData()).get("archivo");
        return response(200).json({
          valido: true,
          errores: [],
          resumen: {
            productos: 12,
            clientes: 3,
            proveedores: 2,
            productosConStock: 10,
            valorUsd: { monto: "1500.0000", moneda: "USD" },
          },
        });
      }),
      http.post("/api/v1/carga-inicial", async ({ request, response }) => {
        cargado = (await request.formData()).get("archivo");
        clave = request.headers.get("Idempotency-Key");
        cargas = [CARGA];
        return response(201).json(CARGA);
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion?pestana=carga" });

    expect(await screen.findByText("Todavía no se ha hecho ninguna carga.")).toBeVisible();
    await usuario.upload(screen.getByLabelText("Archivo de Excel (.xlsx)"), xlsx());

    expect(await screen.findByText("El archivo está listo para cargar.")).toBeVisible();
    expect(screen.getByText("Productos con stock").nextSibling).toHaveTextContent("10");
    expect(validado).not.toBeNull();

    await usuario.click(screen.getByRole("button", { name: "Confirmar la carga" }));
    expect(await screen.findByText("Carga II-001 registrada")).toBeVisible();
    expect(cargado).not.toBeNull();
    expect(clave).toMatch(/^[0-9a-f-]{36}$/);

    const tabla = await screen.findByRole("table", { name: "Cargas realizadas" });
    expect(within(tabla).getAllByRole("row")[1]).toHaveTextContent(
      "II-00106/10/2026Jose Ochoacarga.xlsx12 productos · 3 clientes · 2 proveedores",
    );
    expect(screen.queryByRole("button", { name: "Confirmar la carga" })).not.toBeInTheDocument();
  });

  it("muestra los errores agrupados por hoja con su fila y no deja confirmar (CP-29)", async () => {
    servidor.use(
      http.get("/api/v1/carga-inicial", ({ response }) => response(200).json([])),
      http.post("/api/v1/carga-inicial/validar", ({ response }) =>
        response(200).json({
          valido: false,
          errores: [
            { hoja: "Productos", fila: 3, mensaje: "La categoría «Sensores» no existe." },
            { hoja: "Productos", fila: 7, mensaje: "El código CAM-1 está repetido." },
            { hoja: "Clientes", fila: 2, mensaje: "Falta el nombre." },
          ],
        }),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion?pestana=carga" });
    await usuario.upload(await screen.findByLabelText("Archivo de Excel (.xlsx)"), xlsx());

    expect(
      await screen.findByText("El archivo tiene 3 errores. Corrígelos y vuelve a subirlo."),
    ).toBeVisible();
    const productos = screen.getByRole("region", { name: "Hoja Productos" });
    expect(
      within(productos)
        .getAllByRole("listitem")
        .map((l) => l.textContent),
    ).toEqual(["Fila 3La categoría «Sensores» no existe.", "Fila 7El código CAM-1 está repetido."]);
    expect(screen.getByRole("region", { name: "Hoja Clientes" })).toHaveTextContent("Fila 2Falta el nombre.");
    expect(screen.queryByRole("button", { name: "Confirmar la carga" })).not.toBeInTheDocument();
  });

  it("si al confirmar aparecen errores, los muestra y no guarda nada", async () => {
    servidor.use(
      http.get("/api/v1/carga-inicial", ({ response }) => response(200).json([])),
      http.post("/api/v1/carga-inicial/validar", ({ response }) =>
        response(200).json({ valido: true, errores: [], resumen: { productos: 1 } }),
      ),
      http.post("/api/v1/carga-inicial", () =>
        problema(400, "CARGA_INICIAL_CON_ERRORES", "El archivo tiene errores.", {
          errores: [{ hoja: "Productos", fila: 4, mensaje: "El código CAM-9 ya existe." }],
        }),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion?pestana=carga" });
    await usuario.upload(await screen.findByLabelText("Archivo de Excel (.xlsx)"), xlsx());
    await usuario.click(await screen.findByRole("button", { name: "Confirmar la carga" }));

    expect(await screen.findByRole("region", { name: "Hoja Productos" })).toHaveTextContent(
      "Fila 4El código CAM-9 ya existe.",
    );
    expect(screen.queryByRole("button", { name: "Confirmar la carga" })).not.toBeInTheDocument();
  });

  it("solo acepta archivos .xlsx y descarga la plantilla", async () => {
    const crear = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:plantilla");
    const clic = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    servidor.use(
      http.get("/api/v1/carga-inicial", ({ response }) => response(200).json([])),
      http.get(
        "/api/v1/carga-inicial/plantilla",
        () =>
          new HttpResponse("PK", {
            headers: { "Content-Disposition": 'attachment; filename="plantilla-carga-inicial.xlsx"' },
          }),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/configuracion?pestana=carga" });

    await usuario.upload(await screen.findByLabelText("Archivo de Excel (.xlsx)"), xlsx("datos.csv"));
    expect(await screen.findByText("Elige un archivo de Excel (.xlsx).")).toBeVisible();

    await usuario.click(screen.getByRole("button", { name: "Descargar plantilla" }));
    await vi.waitFor(() => {
      expect(clic).toHaveBeenCalled();
    });
    expect(crear).toHaveBeenCalled();
    crear.mockRestore();
    clic.mockRestore();
  });

  it("también se llega desde el inventario vacío", async () => {
    servidor.use(
      http.get("/api/v1/inventario", ({ response }) =>
        response(200).json({ totalProductos: 0, productos: { contenido: [], totalPaginas: 0 } }),
      ),
    );
    renderizarApp({ ruta: "/inventario" });
    expect(await screen.findByRole("link", { name: "Cargar el inventario desde Excel" })).toHaveAttribute(
      "href",
      "/configuracion?pestana=carga",
    );
  });
});
