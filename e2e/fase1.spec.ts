import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import { ingresar, simularApi } from "./api-simulada";

const esCelular = (page: Page) => (page.viewportSize()?.width ?? 0) < 820;

function vigilarConsola(page: Page) {
  const errores: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errores.push(m.text());
  });
  return errores;
}

test("CP-10 y CP-11: registrar la tasa del bolívar con doble digitación y alerta de variación", async ({
  page,
}) => {
  const errores = vigilarConsola(page);
  await simularApi(page, { bolivarDeHoy: false });
  await ingresar(page);

  const aviso = page
    .getByRole("status")
    .filter({ hasText: "No se ha registrado la tasa del bolívar de hoy" });
  await aviso.getByRole("button", { name: "Registrar tasa del día" }).click();
  const dialogo = page.getByRole("dialog", { name: "Tasa del bolívar de hoy" });

  // CP-10: los dos valores no coinciden → no se guarda.
  await dialogo.getByLabel("Tasa", { exact: true }).fill("500");
  await dialogo.getByLabel("Repite la tasa").fill("50,5");
  await dialogo.getByRole("button", { name: "Guardar tasa" }).click();
  await expect(dialogo.getByText("Los dos valores no coinciden. Digítala de nuevo.")).toBeVisible();

  // CP-11: 50 → 500 supera el 5 %: hay que aceptarlo expresamente.
  await dialogo.getByLabel("Repite la tasa").fill("500");
  await expect(dialogo.getByText(/La tasa cambia 900 %/)).toBeVisible();
  const guardar = dialogo.getByRole("button", { name: "Guardar tasa" });
  await expect(guardar).toBeDisabled();
  await dialogo.getByRole("checkbox", { name: "Confirmo la variación de 900 %" }).check();
  await guardar.click();

  await expect(page.getByText("Tasa registrada").first()).toBeVisible();
  await expect(aviso).toBeHidden();
  const tasas = esCelular(page)
    ? page.getByRole("link", { name: /Tasas de cambio: COP/ })
    : page.getByRole("link", { name: /Tasas de hoy/ });
  await expect(tasas).toContainText("500");
  expect(errores).toEqual([]);
});

test("crear un producto con foto comprimida en el navegador", async ({ page }) => {
  const errores = vigilarConsola(page);
  const { estado } = await simularApi(page);
  await ingresar(page);

  await page.goto("/inventario");
  await page.getByRole("link", { name: "Nuevo producto" }).click();
  await page.getByRole("heading", { level: 1, name: "Nuevo producto" }).waitFor();
  await page.getByLabel("Código", { exact: true }).fill("CAM-D2");
  await page.getByLabel("Nombre", { exact: true }).fill("Cámara domo 2MP");
  await page.getByLabel("Categoría", { exact: true }).selectOption({ label: "Cámaras" });
  await page.getByLabel("Unidad de medida", { exact: true }).selectOption({ label: "Unidad (und)" });
  await page.getByLabel(/Controla serial/).check();
  await page.getByLabel("Precio instalador").fill("25,50");
  await page.getByLabel("Precio cliente final").fill("32");
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByText("Producto creado").first()).toBeVisible();
  await expect(page).toHaveURL(/\/inventario\/productos\/\d+\/editar$/);
  expect(estado.productos[0]).toMatchObject({
    codigo: "CAM-D2",
    precioInstalador: "25.50",
    controlaSerial: true,
  });

  // La foto se comprime con canvas antes de subirla (BF-14).
  await page.getByLabel("Foto del producto").setInputFiles({
    name: "camara.png",
    mimeType: "image/png",
    buffer: readFileSync("public/pwa-512.png"),
  });
  await expect(page.getByRole("img", { name: "Foto del producto" })).toBeVisible();
  expect(["image/webp", "image/jpeg"]).toContain(estado.productos[0]?.fotoTipo);

  await page.getByRole("link", { name: "Inventario" }).first().click();
  await expect(page.getByRole("list", { name: "Inventario" })).toContainText("Cámara domo 2MP");
  expect(errores).toEqual([]);
});

test("crear un cliente instalador y abrir su detalle", async ({ page }) => {
  const errores = vigilarConsola(page);
  await simularApi(page);
  await ingresar(page);

  await page.goto("/clientes");
  await page.getByRole("link", { name: "Nuevo cliente" }).click();
  await page.getByRole("heading", { level: 1, name: "Nuevo cliente" }).waitFor();
  await page.getByLabel("Tipo de cliente", { exact: true }).selectOption({ label: "Instalador" });
  await expect(page.getByText("Se le aplicará el precio instalador")).toBeVisible();
  await page.getByLabel("Nombre o razón social").fill("Ferretería El Tornillo");
  await page.getByLabel("Teléfono / WhatsApp").fill("3001234567");
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Ferretería El Tornillo" })).toBeVisible();
  await expect(page.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
    "href",
    "https://wa.me/573001234567",
  );
  await expect(page.getByText("Este cliente todavía no tiene ventas ni instalaciones.")).toBeVisible();
  expect(errores).toEqual([]);
});
