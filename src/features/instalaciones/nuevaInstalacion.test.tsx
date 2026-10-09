import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import type * as Imagen from "@/lib/imagen";
import { cliente, HOY, instalacion, pagina, producto, serial, vistaPreviaVenta } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

vi.mock("@/lib/imagen", async (cargarOriginal) => {
  const original = await cargarOriginal<typeof Imagen>();
  // jsdom no dibuja en canvas: las imágenes válidas pasan tal cual; lo demás va a la validación real.
  return {
    ...original,
    comprimirImagen: (archivo: File, uso: "foto" | "logo") =>
      (original.TIPOS_IMAGEN as readonly string[]).includes(archivo.type)
        ? Promise.resolve(archivo)
        : original.comprimirImagen(archivo, uso),
  };
});

const sinNbsp = (t: string | null) => (t ?? "").replace(/[\u00a0\u202f]/g, " ");
interface Cuerpo {
  clienteId: number;
  moneda: "USD" | "COP" | "VES";
  fecha?: string;
  tecnicos: number[];
  manoDeObra?: string;
  garantiaManoObraMeses?: number;
  lineas?: { productoId: number; cantidad?: string; seriales?: string[] }[];
}

const cable = producto({
  id: 11,
  nombre: "Cable UTP",
  codigo: "CAB-UTP",
  controlaSerial: false,
  unidadMedida: { id: 2, nombre: "Metro", abreviatura: "m", admiteDecimales: true, version: 0 },
});

function servir(opciones: { sinStock?: boolean } = {}) {
  const previas: Cuerpo[] = [];
  servidor.use(
    http.get("/api/v1/clientes", ({ response }) => response(200).json(pagina([cliente()]))),
    http.get("/api/v1/clientes/{id}", ({ response }) => response(200).json(cliente())),
    http.get("/api/v1/usuarios/tecnicos", ({ response }) =>
      response(200).json([
        { id: 1, nombre: "Jose Ochoa" },
        { id: 2, nombre: "Victor" },
      ]),
    ),
    http.get("/api/v1/productos", ({ response }) => response(200).json(pagina([producto(), cable]))),
    http.get("/api/v1/inventario/productos/{id}/seriales", ({ response }) => response(200).json([serial()])),
    http.post("/api/v1/instalaciones/vista-previa", async ({ request, response }) => {
      const cuerpo = (await request.json()) as Cuerpo;
      previas.push(cuerpo);
      const venta = vistaPreviaVenta({ moneda: cuerpo.moneda, lineas: cuerpo.lineas ?? [] });
      const meses = cuerpo.garantiaManoObraMeses ?? 3;
      return response(200).json({
        fecha: cuerpo.fecha ?? HOY,
        moneda: cuerpo.moneda,
        direccion: "Calle 10 # 5-20",
        tasas: venta.tasas ?? {},
        avisos: cuerpo.fecha === "2026-09-28" ? ["Se usa la TRM del 26/09/2026."] : [],
        puedeGuardar: !opciones.sinStock,
        lineas: (venta.lineas ?? []).map((l) =>
          opciones.sinStock ? { ...l, avisoStock: "Stock insuficiente · quedan 50 m" } : l,
        ),
        resumen: {
          material: { usd: { monto: "25.5000", moneda: "USD" } },
          manoDeObra: { usd: { monto: cuerpo.manoDeObra ?? "0", moneda: "USD" } },
          subtotal: { usd: { monto: "65.5000", moneda: "USD" } },
          total: { usd: { monto: "65.5000", moneda: "USD" } },
          costo: { usd: { monto: "17.5000", moneda: "USD" } },
          utilidad: { usd: { monto: "48.0000", moneda: "USD" } },
          porcentajeUtilidad: "73.28",
        },
        garantias: {
          manoObraMeses: meses,
          venceManoObra: meses === 1 ? "2026-11-01" : "2027-01-01",
          venceEquipos: "2027-01-01",
        },
      });
    }),
  );
  return previas;
}

async function elegirCliente(usuario: ReturnType<typeof renderizarApp>["usuario"]) {
  await usuario.click(await screen.findByRole("button", { name: "Elegir cliente" }));
  await usuario.click(await screen.findByRole("button", { name: /Ferretería El Tornillo/ }));
}

async function agregar(usuario: ReturnType<typeof renderizarApp>["usuario"], nombre: RegExp) {
  await usuario.click(screen.getByRole("button", { name: "Agregar producto" }));
  await usuario.click(await screen.findByRole("button", { name: nombre }));
}

describe("Nueva instalación (RF-107 a RF-119)", () => {
  it("propone la dirección del cliente, usa la garantía de Configuración y muestra el cobro", async () => {
    const previas = servir();
    const { usuario } = renderizarApp({ ruta: "/instalaciones/nueva" });

    await elegirCliente(usuario);
    expect(screen.getByLabelText("Dirección de la instalación")).toHaveValue("Calle 10 # 5-20");
    expect(screen.getByRole("checkbox", { name: "Jose Ochoa" })).toBeChecked();
    expect(screen.getByLabelText("Condiciones de la garantía")).toHaveValue(
      "La garantía no cubre daños por mal uso.",
    );
    expect(screen.getByRole("radio", { name: "3 meses" })).toHaveAttribute("aria-checked", "true");

    await usuario.type(screen.getByLabelText("Mano de obra"), "40");
    const cobro = screen.getByRole("complementary", { name: "Cobro" });
    await waitFor(() => {
      expect(sinNbsp(cobro.textContent)).toContain("MaterialUS$ 25,50");
    });
    expect(sinNbsp(cobro.textContent)).toContain("UtilidadUS$ 48,00 · 73,28 %");
    expect(screen.getByText("Mano de obra vigente hasta 01/01/2027")).toBeVisible();

    await usuario.click(screen.getByRole("radio", { name: "1 mes" }));
    expect(await screen.findByText("Mano de obra vigente hasta 01/11/2026")).toBeVisible();
    expect(previas.at(-1)).toMatchObject({
      clienteId: 20,
      tecnicos: [1],
      manoDeObra: "40",
      garantiaManoObraMeses: 1,
    });
  });

  it("acepta una fecha anterior con su aviso de tasas y rechaza una futura (P-38)", async () => {
    const previas = servir();
    const { usuario } = renderizarApp({ ruta: "/instalaciones/nueva?clienteId=20" });
    const fecha = await screen.findByLabelText("Fecha");
    await usuario.clear(fecha);
    await usuario.type(fecha, "2026-09-28");
    await usuario.type(screen.getByLabelText("Mano de obra"), "40");
    expect(await screen.findByText("Se usa la TRM del 26/09/2026.")).toBeVisible();
    expect(previas.at(-1)?.fecha).toBe("2026-09-28");

    await usuario.clear(fecha);
    await usuario.type(fecha, "2099-01-01");
    await usuario.click(screen.getByRole("button", { name: "Guardar instalación" }));
    expect(await screen.findByText("La fecha no puede ser posterior a hoy.")).toBeVisible();
  });

  it("no deja guardar si falta stock (CP-15)", async () => {
    servir({ sinStock: true });
    const { usuario } = renderizarApp({ ruta: "/instalaciones/nueva?clienteId=20" });
    await screen.findByLabelText("Dirección de la instalación");
    await agregar(usuario, /Cable UTP/);
    const cantidad = screen.getByLabelText("Cantidad de Cable UTP");
    await usuario.clear(cantidad);
    await usuario.type(cantidad, "60");
    expect(await screen.findByText("Stock insuficiente · quedan 50 m")).toBeVisible();
    expect(screen.getByRole("button", { name: "Guardar instalación" })).toBeDisabled();
  });

  it("valida técnicos, descripción y que haya material o mano de obra (P-41)", async () => {
    servir();
    const { usuario } = renderizarApp({ ruta: "/instalaciones/nueva?clienteId=20" });
    await usuario.click(await screen.findByRole("checkbox", { name: "Jose Ochoa" }));
    await usuario.click(screen.getByRole("button", { name: "Guardar instalación" }));
    expect(await screen.findByText("Elige al menos un técnico.")).toBeVisible();
    expect(screen.getByText("Escribe la descripción del trabajo.")).toBeVisible();

    await usuario.click(screen.getByRole("checkbox", { name: "Victor" }));
    await usuario.type(screen.getByLabelText("Descripción del trabajo"), "Revisión");
    await usuario.click(screen.getByRole("button", { name: "Guardar instalación" }));
    expect(await screen.findByText("Agrega material o escribe la mano de obra.")).toBeVisible();
  });

  it("guarda solo con mano de obra, sube las fotos después y muestra la confirmación (RF-120)", async () => {
    servir();
    let cuerpo: unknown;
    let clave: string | null = null;
    const subidas: string[] = [];
    servidor.use(
      http.post("/api/v1/instalaciones", async ({ request, response }) => {
        cuerpo = await request.json();
        clave = request.headers.get("Idempotency-Key");
        return response(201).json(instalacion({ id: 90, consecutivo: "I-0009" }));
      }),
      http.post("/api/v1/instalaciones/{id}/fotos", ({ request, response }) => {
        const grupo = new URL(request.url).searchParams.get("grupo") ?? "";
        subidas.push(grupo);
        if (subidas.length === 2) return problema(422, "FOTOS_MAXIMAS", "Ya hay 30 fotos.");
        return response(200).json(instalacion({ id: 90 }));
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/instalaciones/nueva?clienteId=20" });
    await usuario.type(await screen.findByLabelText("Descripción del trabajo"), "Mantenimiento de DVR");
    await usuario.type(screen.getByLabelText("Mano de obra"), "40");
    await usuario.click(screen.getByRole("checkbox", { name: "Victor" }));

    const foto = (nombre: string) => new File(["x"], nombre, { type: "image/jpeg" });
    await usuario.upload(screen.getByLabelText("Agregar fotos · Antes"), [foto("a.jpg"), foto("b.jpg")]);
    await usuario.upload(screen.getByLabelText("Agregar fotos · Después"), foto("c.jpg"));
    expect(screen.getByRole("heading", { name: "Antes · 2" })).toBeVisible();
    await usuario.click(screen.getByRole("button", { name: "Quitar foto 2 de Antes" }));
    expect(screen.getByRole("heading", { name: "Antes · 1" })).toBeVisible();

    await usuario.click(screen.getByRole("button", { name: "Guardar instalación" }));
    expect(await screen.findByRole("heading", { name: "Instalación I-0009 registrada" })).toBeVisible();
    expect(screen.getByText("Garantía de mano de obra hasta 01/01/2027")).toBeVisible();
    expect(await screen.findByText(/1 foto no se pudo subir/)).toBeVisible();
    expect(screen.getByText("1 foto subida.")).toBeVisible();
    expect(subidas).toEqual(["ANTES", "DESPUES"]);
    expect(cuerpo).toEqual({
      clienteId: 20,
      direccion: "Calle 10 # 5-20",
      fecha: expect.any(String) as string,
      tecnicos: [1, 2],
      descripcion: "Mantenimiento de DVR",
      lineas: [],
      moneda: "USD",
      manoDeObra: "40",
      garantiaManoObraMeses: 3,
      condicionesGarantia: "La garantía no cubre daños por mal uso.",
      monedasComprobante: [],
    });
    expect(clave).toMatch(/^[0-9a-f-]{36}$/);
    expect(screen.getByRole("link", { name: "Ver la instalación" })).toHaveAttribute(
      "href",
      "/instalaciones/90",
    );
  });

  it("rechaza archivos que no son imagen antes de subirlos (P-16)", async () => {
    servir();
    renderizarApp({ ruta: "/instalaciones/nueva?clienteId=20" });
    const entrada = await screen.findByLabelText("Agregar fotos · Durante");
    // El selector de archivos permite elegir "Todos los archivos": se simula ese caso.
    fireEvent.change(entrada, {
      target: { files: [new File(["%PDF"], "plano.pdf", { type: "application/pdf" })] },
    });
    const grupo = screen.getByRole("heading", { name: "Durante · 0" }).closest("section")!;
    expect(await within(grupo).findByText(/plano\.pdf: Elige una imagen JPEG, PNG o WebP/)).toBeVisible();
  });

  it("muestra en su campo los errores del backend", async () => {
    servir();
    servidor.use(
      http.post("/api/v1/instalaciones", () =>
        problema(400, "INSTALACION_SIN_DIRECCION", "Ingresa la dirección de la instalación."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/instalaciones/nueva?clienteId=20" });
    await usuario.type(await screen.findByLabelText("Descripción del trabajo"), "Revisión");
    await usuario.type(screen.getByLabelText("Mano de obra"), "40");
    await usuario.click(screen.getByRole("button", { name: "Guardar instalación" }));
    expect(await screen.findByText("Ingresa la dirección de la instalación.")).toBeVisible();
    expect(screen.getByLabelText("Dirección de la instalación")).toHaveAttribute("aria-invalid", "true");
  });
});
