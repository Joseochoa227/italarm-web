import { expect, type Page, test } from "@playwright/test";

import { simularApi } from "./api-simulada";

async function ingresar(page: Page, contrasena: string) {
  await page.getByLabel("Correo").fill("jose@italarm.test");
  await page.getByLabel("Contraseña", { exact: true }).fill(contrasena);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

const esCelular = (page: Page) => (page.viewportSize()?.width ?? 0) < 820;

test("ingresar, recorrer el menú, cambiar la contraseña y cerrar sesión", async ({ page }) => {
  const errores: string[] = [];
  page.on("console", (m) => {
    // El navegador registra toda respuesta 4xx; la de la contraseña errada es esperada.
    if (m.type() === "error" && !m.text().includes("status of 401")) errores.push(m.text());
  });
  const { CONTRASENA_INICIAL } = await simularApi(page);

  await page.goto("/");
  await expect(page).toHaveURL(/\/ingresar$/);

  // Contraseña errada
  await ingresar(page, "equivocada");
  await expect(page.getByRole("alert")).toHaveText("El correo o la contraseña no son correctos.");

  // Ingreso correcto
  await page.getByLabel("Contraseña", { exact: true }).fill(CONTRASENA_INICIAL);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("heading", { name: "Hola, Jose" })).toBeVisible();

  // Menú: lateral en computador, barras en celular
  const menu = page.getByRole("navigation", { name: "Menú principal" });
  if (esCelular(page)) {
    await expect(page.getByRole("banner")).toContainText("ITALARM");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page
      .getByRole("dialog", { name: "Registrar" })
      .getByRole("button", { name: "Nueva cotización" })
      .click();
    await expect(page.getByRole("heading", { name: "Nueva cotización" })).toBeVisible();
    await menu.getByRole("link", { name: "Clientes" }).click();
  } else {
    await expect(menu.getByRole("link")).toHaveCount(8);
    await menu.getByRole("link", { name: "Clientes" }).click();
  }
  await expect(page.getByText("Esta sección llega en la Fase 1")).toBeVisible();

  // Recargar conserva la sesión (token en localStorage)
  await page.reload();
  await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();

  // Cambiar la contraseña desde el menú de la cuenta
  await page.getByRole("button", { name: "Menú de tu cuenta" }).click();
  await page.getByRole("menuitem", { name: "Cambiar contraseña" }).click();
  await page.getByLabel("Contraseña actual").fill(CONTRASENA_INICIAL);
  await page.getByLabel("Contraseña nueva", { exact: true }).fill("Nueva.Clave9");
  await page.getByLabel("Repite la contraseña nueva").fill("Nueva.Clave9");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByText("Contraseña cambiada")).toBeVisible();

  // Cerrar sesión y volver a ingresar con la nueva
  await page.getByRole("button", { name: "Menú de tu cuenta" }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("button", { name: "Ingresar" })).toBeVisible();
  await ingresar(page, "Nueva.Clave9");
  await expect(page.getByRole("heading", { name: "Hola, Jose" })).toBeVisible();

  // Ningún error de consola (incluidas violaciones de la CSP)
  expect(errores).toEqual([]);
});

test("la app compilada declara la CSP estricta", async ({ page }) => {
  await page.goto("/ingresar");
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  expect(csp).toContain("script-src 'self';");
  expect(csp).toContain("connect-src 'self' http://localhost:8080");
  expect(csp).toContain("object-src 'none'");
});
