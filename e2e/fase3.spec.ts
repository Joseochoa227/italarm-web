import { expect, type Page, test } from "@playwright/test";

import { ingresar, simularApi } from "./api-simulada";

function vigilarConsola(page: Page) {
  const errores: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errores.push(m.text());
  });
  return errores;
}

const COMPRA = { tipo: "COMPRA", id: 40, consecutivo: "C-0001" };

async function preparar(page: Page) {
  const { estado } = await simularApi(page);
  estado.clientes.push({
    id: 20,
    tipo: "INSTALADOR",
    nombre: "Ferretería El Tornillo",
    telefono: "+573001234567",
    precioAplicado: "INSTALADOR",
    precioAplicadoDescripcion: "Se le aplicará el precio instalador",
    version: 0,
  });
  estado.productos.push(
    {
      id: 10,
      codigo: "CAM-D2",
      nombre: "Cámara domo 2MP",
      categoriaId: 1,
      unidadMedidaId: 1,
      controlaSerial: true,
      monedaPrecio: "USD",
      precioInstalador: "25.5000",
      precioClienteFinal: "32.0000",
      stock: 2,
      costo: 17.5,
    },
    {
      id: 11,
      codigo: "CAB-UTP",
      nombre: "Cable UTP",
      categoriaId: 1,
      unidadMedidaId: 2,
      controlaSerial: false,
      monedaPrecio: "USD",
      precioInstalador: "0.5000",
      precioClienteFinal: "0.8000",
      stock: 100,
      costo: 0.3,
    },
  );
  estado.seriales.push(
    { id: 1, numero: "SN-001", estado: "EN_BODEGA", productoId: 10, documentoEntrada: COMPRA },
    { id: 2, numero: "SN-002", estado: "EN_BODEGA", productoId: 10, documentoEntrada: COMPRA },
  );
  await ingresar(page);
  return estado;
}

async function agregar(page: Page, nombre: RegExp) {
  await page.getByRole("button", { name: "Agregar producto" }).click();
  await page.getByRole("dialog", { name: "Agregar producto" }).getByRole("button", { name: nombre }).click();
}

test("vender una cámara con serial y cable por metro, con descuento, y anular la venta", async ({ page }) => {
  const errores = vigilarConsola(page);
  const estado = await preparar(page);

  await page.goto("/clientes/20");
  await page.getByRole("main").getByRole("link", { name: "Venta", exact: true }).click();
  await expect(page.getByText("Se le aplicará el precio instalador")).toBeVisible();

  await agregar(page, /Cámara domo 2MP/);
  await page.getByRole("button", { name: "Serial SN-002 de Cámara domo 2MP" }).click();
  await agregar(page, /Cable UTP/);
  await page.getByLabel("Cantidad de Cable UTP").fill("20,5");

  const resumen = page.getByRole("complementary", { name: "Resumen" });
  await page.getByRole("radio", { name: "Valor" }).click();
  await page.getByLabel("Valor del descuento").fill("5");
  // 25,50 + 20,5 × 0,50 = 35,75; menos 5 = 30,75.
  await expect(resumen.getByRole("status", { name: "Total de contado" })).toContainText("30,75");
  await page.getByRole("button", { name: "Guardar venta" }).click();

  await expect(page.getByRole("heading", { name: "Venta V-0001 registrada" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar comprobante por WhatsApp" })).toBeVisible();
  expect(estado.seriales.find((s) => s.numero === "SN-002")?.estado).toBe("VENDIDO");

  await page.getByRole("link", { name: "Ver la venta" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Venta V-0001" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Productos" })).toContainText("garantía hasta");

  await page.getByRole("button", { name: "Anular" }).click();
  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel("Motivo de la anulación").fill("Prueba");
  await dialogo.getByRole("button", { name: "Anular" }).click();
  await expect(page.getByText("Venta anulada")).toBeVisible();
  expect(estado.seriales.find((s) => s.numero === "SN-002")?.estado).toBe("EN_BODEGA");
  expect(errores).toEqual([]);
});

test("no deja vender más de lo disponible", async ({ page }) => {
  const errores = vigilarConsola(page);
  await preparar(page);

  await page.goto("/ventas/nueva?clienteId=20");
  await agregar(page, /Cable UTP/);
  await page.getByLabel("Cantidad de Cable UTP").fill("150");
  await expect(page.getByText("Stock insuficiente · quedan 100 m")).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar venta" })).toBeDisabled();
  expect(errores).toEqual([]);
});
