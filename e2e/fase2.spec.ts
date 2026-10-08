import { expect, type Page, test } from "@playwright/test";

import { ingresar, simularApi } from "./api-simulada";

function vigilarConsola(page: Page) {
  const errores: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errores.push(m.text());
  });
  return errores;
}

const CAMARA = {
  id: 10,
  codigo: "CAM-D2",
  nombre: "Cámara domo 2MP",
  categoriaId: 1,
  unidadMedidaId: 1,
  controlaSerial: true,
  monedaPrecio: "USD",
  precioInstalador: "25.5000",
  precioClienteFinal: "32.0000",
};

test("registrar una compra con seriales y ver el costo y el kárdex", async ({ page }) => {
  const errores = vigilarConsola(page);
  const { estado } = await simularApi(page);
  estado.productos.push({ ...CAMARA });
  estado.proveedores.push({
    id: 30,
    nombre: "Distribuidora Seguridad Total",
    monedaHabitual: "USD",
    version: 0,
  });
  await ingresar(page);

  await page.goto("/compras/nueva");
  await page
    .getByLabel("Proveedor", { exact: true })
    .selectOption({ label: "Distribuidora Seguridad Total" });
  await page.getByLabel("N.º de factura del proveedor").fill("FE-100");
  await page.getByRole("button", { name: "Agregar producto" }).click();
  await page
    .getByRole("dialog", { name: "Agregar producto" })
    .getByRole("button", { name: /Cámara domo 2MP/ })
    .click();
  await page.getByLabel("Cantidad de Cámara domo 2MP").fill("2");
  await page.getByLabel("Costo unitario de Cámara domo 2MP").fill("20");

  // Vista previa del backend: sin stock, el costo es el de la factura.
  await expect(page.getByText("Costo inicial US$ 20,00")).toBeVisible();
  const guardar = page.getByRole("button", { name: "Guardar y sumar al inventario" });
  await expect(guardar).toBeDisabled();
  await page.getByLabel("Serial 1 de Cámara domo 2MP").fill("sn-001");
  await page.getByLabel("Serial 2 de Cámara domo 2MP").fill("sn-002");
  await guardar.click();

  await expect(page.getByRole("heading", { level: 1, name: "Compra C-0001" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Productos" })).toContainText("SN-001, SN-002");

  await page.goto("/inventario/productos/10");
  await expect(page.getByText("2 und", { exact: true })).toBeVisible();
  const kardex = page.getByRole("table", { name: "Kárdex" });
  await kardex.getByRole("link", { name: "C-0001" }).waitFor();
  await expect(page.getByRole("table", { name: "Historial de costo" })).toContainText("sin stock");
  expect(errores).toEqual([]);
});

test("ajuste de salida eligiendo un serial", async ({ page }) => {
  const errores = vigilarConsola(page);
  const { estado } = await simularApi(page);
  const compra = { tipo: "COMPRA", id: 40, consecutivo: "C-0001" };
  estado.productos.push({ ...CAMARA, stock: 2, costo: 20 });
  estado.seriales.push(
    { id: 1, numero: "SN-001", estado: "EN_BODEGA", productoId: 10, documentoEntrada: compra },
    { id: 2, numero: "SN-002", estado: "EN_BODEGA", productoId: 10, documentoEntrada: compra },
  );
  await ingresar(page);

  await page.goto("/inventario/productos/10");
  await page.getByRole("link", { name: "Ajustar inventario" }).click();
  await page.getByRole("radio", { name: "Salida" }).click();
  await page.getByLabel("Motivo", { exact: true }).selectOption({ label: "Daño" });
  await page.getByRole("checkbox", { name: "SN-002" }).check();
  await expect(page.getByText("Stock 2 und → 1 und")).toBeVisible();
  await page.getByRole("button", { name: "Guardar ajuste" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Ajuste AJ-001" })).toBeVisible();
  await expect(page.getByText("SN-002", { exact: true })).toBeVisible();
  expect(estado.seriales.find((s) => s.numero === "SN-002")?.estado).toBe("DADO_DE_BAJA");
  expect(errores).toEqual([]);
});

test("carga inicial con un error por fila y luego válida (CP-29, CP-28)", async ({ page }) => {
  const errores = vigilarConsola(page);
  await simularApi(page);
  await ingresar(page);

  await page.goto("/configuracion?pestana=carga");
  const archivo = page.getByLabel("Archivo de Excel (.xlsx)");
  const xlsx = (name: string) => ({
    name,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from("PK"),
  });

  await archivo.setInputFiles(xlsx("con-error.xlsx"));
  const hoja = page.getByRole("region", { name: "Hoja Inventario inicial" });
  await expect(hoja).toContainText("Fila 8");
  await expect(page.getByRole("button", { name: "Confirmar la carga" })).toBeHidden();

  await archivo.setInputFiles(xlsx("inventario.xlsx"));
  await expect(page.getByText("El archivo está listo para cargar.")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar la carga" }).click();
  await expect(page.getByText("Carga II-001 registrada").first()).toBeVisible();
  await expect(page.getByRole("table", { name: "Cargas realizadas" })).toContainText("II-001");
  expect(errores).toEqual([]);
});

test("buscar un serial desde el menú y ver su historial", async ({ page }) => {
  const errores = vigilarConsola(page);
  const { estado } = await simularApi(page);
  estado.productos.push({ ...CAMARA, stock: 1, costo: 20 });
  estado.seriales.push({
    id: 1,
    numero: "SN-001",
    estado: "EN_BODEGA",
    productoId: 10,
    documentoEntrada: { tipo: "COMPRA", id: 40, consecutivo: "C-0001" },
  });
  await page.route("**/api/v1/seriales/1", (route) =>
    route.fulfill({
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        serial: {
          id: 1,
          numero: "SN-001",
          estado: "EN_BODEGA",
          producto: { id: 10, nombre: "Cámara domo 2MP" },
        },
        movimientos: [
          {
            tipo: "ENTRADA",
            fecha: "2026-10-01",
            documento: { tipo: "COMPRA", id: 40, consecutivo: "C-0001" },
          },
        ],
        reclamos: [],
      }),
    }),
  );
  await ingresar(page);

  await page.getByRole("button", { name: "Buscar serial" }).click();
  const dialogo = page.getByRole("dialog", { name: "Buscar un serial" });
  await dialogo.getByLabel("Número de serie").fill("sn-0");
  await dialogo.getByRole("button", { name: "Buscar" }).click();
  await dialogo.getByRole("link", { name: /SN-001/ }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Serial SN-001" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Historial" })).toContainText("C-0001");
  expect(errores).toEqual([]);
});
