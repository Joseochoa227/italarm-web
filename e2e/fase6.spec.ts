import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { ingresar, simularApi } from "./api-simulada";

function vigilarConsola(page: Page) {
  const errores: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errores.push(m.text());
  });
  return errores;
}

async function preparar(page: Page) {
  const { estado } = await simularApi(page);
  estado.clientes.push({
    id: 20,
    tipo: "CLIENTE_FINAL",
    nombre: "Ana Gómez",
    telefono: "+573001234567",
    direccion: "Calle 10 # 5-20",
    precioAplicado: "CLIENTE_FINAL",
    precioAplicadoDescripcion: "Se le aplicará el precio cliente final",
    version: 0,
  });
  estado.productos.push({
    id: 11,
    codigo: "CAB-UTP",
    nombre: "Cable UTP",
    categoriaId: 1,
    unidadMedidaId: 2,
    controlaSerial: false,
    monedaPrecio: "USD",
    precioInstalador: "0.5000",
    precioClienteFinal: "0.8000",
    stock: 50,
    stockMinimo: 100,
    costo: 0.3,
  });
  await ingresar(page);
  return estado;
}

test("Inicio con sus bloques, el indicador del menú y los movimientos que abren su detalle", async ({
  page,
}) => {
  const errores = vigilarConsola(page);
  await preparar(page);

  await expect(page.getByRole("group", { name: "Ventas del mes" })).toContainText("0 ventas");
  await expect(page.getByRole("region", { name: "Stock bajo" })).toContainText("Cable UTP50 m / mín. 100");
  await expect(page.getByRole("link", { name: /Inventario.*1 producto bajo el mínimo/ })).toBeVisible();

  // Una venta: el indicador baja y aparece en los últimos movimientos.
  await page
    .getByRole("navigation", { name: "Accesos rápidos" })
    .getByRole("link", { name: "Nueva venta" })
    .click();
  await page.getByRole("button", { name: "Elegir cliente" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Ana Gómez/ })
    .click();
  await page.getByRole("button", { name: "Agregar producto" }).click();
  await page
    .getByRole("dialog", { name: "Agregar producto" })
    .getByRole("button", { name: /Cable UTP/ })
    .click();
  await page.getByLabel("Cantidad de Cable UTP").fill("10");
  await expect(page.getByRole("status", { name: "Total de contado" })).toContainText("8,00");
  await page.getByRole("button", { name: "Guardar venta" }).click();
  await expect(page.getByRole("heading", { name: "Venta V-0001 registrada" })).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("group", { name: "Ventas del mes" })).toContainText("1 venta");
  await expect(page.getByRole("region", { name: "Stock bajo" })).toContainText("Cable UTP40 m / mín. 100");
  await page
    .getByRole("region", { name: "Últimos movimientos" })
    .getByRole("link", { name: /V-0001/ })
    .click();
  await expect(page.getByRole("heading", { level: 1, name: "Venta V-0001" })).toBeVisible();
  expect(errores).toEqual([]);
});

test("Reportes: cambiar de período, de pestaña y exportar a Excel", async ({ page }, informacion) => {
  const errores = vigilarConsola(page);
  await preparar(page);

  if (informacion.project.name === "celular") {
    await page.getByRole("link", { name: "Reportes" }).click();
  } else {
    await page
      .getByRole("navigation", { name: "Menú principal" })
      .getByRole("link", { name: "Reportes" })
      .click();
  }
  await expect(page.getByRole("heading", { level: 1, name: "Reportes" })).toBeVisible();
  const rango = page.getByText(/^Del \d{2}\/\d{2}\/\d{4} al \d{2}\/\d{2}\/\d{4}$/);
  const mesActual = await rango.textContent();
  await page.getByRole("button", { name: "Período anterior" }).click();
  await expect(rango).not.toHaveText(mesActual ?? "");
  await page.getByRole("radio", { name: "Año" }).click();
  await expect(rango).toHaveText(/^Del 01\/01\/\d{4} al 31\/12\/\d{4}$/);

  const [descarga] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Excel" }).click(),
  ]);
  expect(descarga.suggestedFilename()).toMatch(/^reportes-periodo-.*\.xlsx$/);

  await page.getByRole("link", { name: "Seriales" }).click();
  await expect(page.getByRole("radiogroup", { name: "Período" })).toHaveCount(0);
  await page.getByRole("link", { name: "Utilidad por documento" }).click();
  await expect(page.getByText("No hay ventas ni instalaciones en este período.")).toBeVisible();
  expect(errores).toEqual([]);
});

test("Excel de un listado con sus filtros", async ({ page }) => {
  await preparar(page);
  await page.goto("/inventario");
  const [descarga] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Excel" }).click(),
  ]);
  expect(descarga.suggestedFilename()).toMatch(/^inventario-.*\.xlsx$/);
});

const PANTALLAS = [
  "/",
  "/inventario",
  "/inventario/productos/11",
  "/ventas/nueva",
  "/ventas",
  "/instalaciones/nueva",
  "/compras",
  "/compras/nueva",
  "/cotizaciones",
  "/cotizaciones/nueva",
  "/clientes",
  "/garantias",
  "/reportes",
  "/tasas",
  "/configuracion",
];

test("accesibilidad: las pantallas principales no tienen fallas graves (BF-11)", async ({ page }) => {
  await preparar(page);
  const fallas: string[] = [];
  for (const ruta of PANTALLAS) {
    await page.goto(ruta);
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await page.waitForLoadState("networkidle");
    const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    for (const v of resultado.violations.filter((x) => x.impact === "serious" || x.impact === "critical")) {
      fallas.push(`${ruta} · ${v.id} · ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
    }
  }
  expect(fallas).toEqual([]);
});
