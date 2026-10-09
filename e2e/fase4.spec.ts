import { readFileSync } from "node:fs";

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
const FOTO = { name: "foto.png", mimeType: "image/png", buffer: readFileSync("public/pwa-512.png") };

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
      stock: 50,
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

test("registrar una instalación con material, mano de obra y fotos", async ({ page }) => {
  const errores = vigilarConsola(page);
  const estado = await preparar(page);

  await page.goto("/clientes/20");
  await page.getByRole("main").getByRole("link", { name: "Instalación", exact: true }).click();
  await expect(page.getByLabel("Dirección de la instalación")).toHaveValue("Calle 10 # 5-20");
  await page.getByLabel("Descripción del trabajo").fill("Instalación de una cámara en la entrada");

  await agregar(page, /Cámara domo 2MP/);
  await page.getByRole("button", { name: "Serial SN-002 de Cámara domo 2MP" }).click();
  await agregar(page, /Cable UTP/);
  await page.getByLabel("Cantidad de Cable UTP").fill("20");
  await page.getByLabel("Mano de obra", { exact: true }).fill("40");

  await page.getByLabel("Agregar fotos · Antes").setInputFiles(FOTO);
  await page.getByLabel("Agregar fotos · Después").setInputFiles(FOTO);
  await expect(page.getByRole("heading", { name: "Antes · 1" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Después · 1" })).toBeVisible();

  const cobro = page.getByRole("complementary", { name: "Cobro" });
  // 32 + 20 × 0,80 + 40 = 88.
  await expect(cobro.getByRole("status", { name: "Total de contado" })).toContainText("88,00");
  await expect(page.getByText(/Mano de obra vigente hasta/)).toBeVisible();
  await page.getByRole("button", { name: "Guardar instalación" }).click();

  await expect(page.getByRole("heading", { name: "Instalación I-0001 registrada" })).toBeVisible();
  await expect(page.getByText("2 fotos subidas.")).toBeVisible();
  expect(estado.seriales.find((s) => s.numero === "SN-002")?.estado).toBe("INSTALADO");

  await page.getByRole("link", { name: "Ver la instalación" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Instalación I-0001" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Antes · 1" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Después · 1" })).toBeVisible();
  expect(errores).toEqual([]);
});

test("no deja usar más cable del que hay (CP-15)", async ({ page }) => {
  const errores = vigilarConsola(page);
  await preparar(page);

  await page.goto("/instalaciones/nueva?clienteId=20");
  await agregar(page, /Cable UTP/);
  await page.getByLabel("Cantidad de Cable UTP").fill("60");
  await expect(page.getByText("Stock insuficiente · quedan 50 m")).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar instalación" })).toBeDisabled();
  expect(errores).toEqual([]);
});

test("buscar la garantía de un serial y registrar un reclamo", async ({ page }) => {
  const errores = vigilarConsola(page);
  const estado = await preparar(page);
  const venta = { tipo: "VENTA", id: 60, consecutivo: "V-0001" };
  Object.assign(estado.seriales[0]!, { estado: "VENDIDO", documentoSalida: venta });

  await page.goto("/ventas");
  await page.getByRole("link", { name: "Garantías" }).click();
  await page.getByRole("searchbox", { name: "Buscar por serial" }).fill("sn-001");
  const lista = page.getByRole("list", { name: "Garantías" });
  await expect(lista.getByRole("listitem")).toHaveCount(1);
  await expect(lista).toContainText("SN-001");

  await lista.getByRole("button", { name: "Registrar reclamo" }).click();
  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel("Problema").fill("No enciende");
  await dialogo.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Reclamo registrado").first()).toBeVisible();
  expect(estado.reclamos).toHaveLength(1);
  expect(errores).toEqual([]);
});
