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

/** Cotización de instalación de Ana Gómez: 2 cámaras, 20 m de cable y US$ 40 de mano de obra. */
async function cotizar(page: Page) {
  await page.goto("/cotizaciones/nueva?clienteId=20");
  await page.getByLabel("Descripción del trabajo").fill("Dos cámaras en la entrada");
  await agregar(page, /Cámara domo 2MP/);
  await page.getByLabel("Cantidad de Cámara domo 2MP").fill("2");
  await agregar(page, /Cable UTP/);
  await page.getByLabel("Cantidad de Cable UTP").fill("20");
  await page.getByLabel("Mano de obra", { exact: true }).fill("40");
  // 2 × 32 + 20 × 0,80 + 40 = 120.
  await expect(page.getByRole("status", { name: "Total de contado" })).toContainText("120,00");
}

test("cotizar, aprobar, convertir en instalación y volver a Aprobada al anularla (CP-22, CP-24)", async ({
  page,
}, informacion) => {
  const errores = vigilarConsola(page);
  const estado = await preparar(page);

  await cotizar(page);
  const pdf = page.getByRole("region", { name: "Vista previa del PDF" });
  if (informacion.project.name === "computador") {
    await expect(pdf).toContainText("Cotización de instalación");
    await expect(pdf).toContainText("Ana Gómez");
    await expect(pdf).toContainText("Dos cámaras en la entrada");
    await expect(pdf).not.toContainText("Costo");
  } else {
    await expect(pdf).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Guardar cotización" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Cotización COT-0001" })).toBeVisible();
  await expect(page.getByText("Borrador", { exact: true })).toBeVisible();
  // Cotizar no aparta material (RF-86).
  expect(estado.productos.find((p) => p.id === 10)?.stock).toBe(2);

  await page.getByRole("button", { name: "Descargar PDF" }).click();
  await expect(page.getByText("En evaluación", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cliente aprobó" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cliente aprobó" }).click();
  await page.getByRole("link", { name: "Convertir en instalación" }).click();

  await expect(page.getByRole("link", { name: "Desde la cotización COT-0001" })).toBeVisible();
  await expect(page.getByLabel("Descripción del trabajo")).toHaveValue("Dos cámaras en la entrada");
  await expect(page.getByLabel("Cantidad de Cable UTP")).toHaveValue("20");
  await expect(page.getByText("Cotizado: 2 und")).toBeVisible();
  await page.getByRole("button", { name: "Serial SN-001 de Cámara domo 2MP" }).click();
  await page.getByRole("button", { name: "Serial SN-002 de Cámara domo 2MP" }).click();
  await page.getByRole("button", { name: "Guardar instalación" }).click();
  await expect(page.getByRole("heading", { name: "Instalación I-0001 registrada" })).toBeVisible();

  await page.getByRole("link", { name: "Ver la instalación" }).click();
  await page.getByRole("link", { name: "COT-0001" }).click();
  await expect(page.getByText("Convertida", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Convertida en la instalación I-0001" }).click();

  await page.getByRole("button", { name: "Anular" }).click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toContainText("La cotización COT-0001 vuelve a Aprobada.");
  await dialogo.getByLabel("Motivo").fill("Prueba");
  await dialogo.getByRole("button", { name: "Anular" }).click();
  await expect(page.getByText("Instalación I-0001 anulada").first()).toBeVisible();
  expect(estado.seriales.every((s) => s.estado === "EN_BODEGA")).toBe(true);
  await page.getByRole("link", { name: "COT-0001" }).click();
  await expect(page.getByText("Aprobada", { exact: true })).toBeVisible();
  expect(errores).toEqual([]);
});

test("rechazar con motivo y duplicar; editar en evaluación crea la versión 2", async ({ page }) => {
  const errores = vigilarConsola(page);
  await preparar(page);

  await cotizar(page);
  await page.getByRole("button", { name: "Guardar cotización" }).click();
  await page.getByRole("button", { name: "Descargar PDF" }).click();
  await expect(page.getByText("En evaluación", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Editar" }).click();
  await expect(page.getByText(/se crea la versión 2/)).toBeVisible();
  await page.getByLabel("Cantidad de Cable UTP").fill("30");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Cotización COT-0001 v2" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Versiones anteriores" })).toBeVisible();

  await page.getByRole("button", { name: "Rechazar" }).click();
  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel("Motivo").selectOption("Precio");
  await dialogo.getByRole("button", { name: "Rechazar" }).click();
  await expect(page.getByText(/^Rechazada el .* · Precio$/)).toBeVisible();

  await page.getByRole("button", { name: "Duplicar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Cotización COT-0002" })).toBeVisible();
  await expect(page.getByText("Borrador", { exact: true })).toBeVisible();

  await page.goto("/cotizaciones");
  const lista = page.getByRole("list", { name: "Cotizaciones" });
  await expect(lista.getByRole("listitem")).toHaveCount(2);
  await expect(lista).toContainText("Rechazada");
  expect(errores).toEqual([]);
});
