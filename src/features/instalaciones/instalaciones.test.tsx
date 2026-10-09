import { screen, waitFor, within } from "@testing-library/react";

import type * as Imagen from "@/lib/imagen";
import { instalacion, pagina } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

vi.mock("@/lib/imagen", async (cargarOriginal) => {
  const original = await cargarOriginal<typeof Imagen>();
  return { ...original, comprimirImagen: (archivo: File) => Promise.resolve(archivo) };
});

const sinNbsp = (t: string | null) => (t ?? "").replace(/[\u00a0\u202f]/g, " ");

function servirInstalacion(...versiones: ReturnType<typeof instalacion>[]) {
  let i = 0;
  servidor.use(
    http.get("/api/v1/instalaciones/{id}", ({ response }) =>
      response(200).json(versiones[Math.min(i++, versiones.length - 1)]!),
    ),
    http.get("/api/v1/garantias/reclamos", ({ response }) => response(200).json([])),
    http.get("/api/v1/usuarios/tecnicos", ({ response }) =>
      response(200).json([
        { id: 1, nombre: "Jose Ochoa" },
        { id: 2, nombre: "Victor" },
      ]),
    ),
  );
}

describe("Listado de instalaciones (RF-121)", () => {
  it("muestra las instalaciones con su garantía, filtra por técnico y estado, y enlaza a Garantías (W-10)", async () => {
    const consultas: URLSearchParams[] = [];
    servidor.use(
      http.get("/api/v1/usuarios/tecnicos", ({ response }) =>
        response(200).json([{ id: 2, nombre: "Victor" }]),
      ),
      http.get("/api/v1/instalaciones", ({ request, response }) => {
        consultas.push(new URL(request.url).searchParams);
        return response(200).json({
          desde: "2026-10-01",
          hasta: "2026-10-31",
          totalesPorMoneda: [{ instalaciones: 1, total: { monto: "65.5000", moneda: "USD" } }],
          totalUsd: { monto: "65.5000", moneda: "USD" },
          utilidadUsd: { monto: "48.0000", moneda: "USD" },
          instalaciones: pagina([
            {
              id: 80,
              consecutivo: "I-0001",
              cliente: "Ferretería El Tornillo",
              fecha: "2026-10-01",
              direccion: "Carrera 5 # 1-10",
              tecnicos: "Jose Ochoa",
              estado: "ACTIVA",
              estadoGarantia: "POR_VENCER",
              moneda: "USD",
              total: { monto: "65.5000", moneda: "USD" },
              utilidad: { monto: "48.0000", moneda: "USD" },
            },
          ]),
        });
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/instalaciones" });

    const [fila] = within(
      await screen.findByRole("list", { name: "Instalaciones del período" }),
    ).getAllByRole("listitem");
    expect(fila).toHaveTextContent("I-0001 · Ferretería El TornilloPor vencer");
    expect(fila).toHaveTextContent("01/10/2026 · Carrera 5 # 1-10 · Jose Ochoa");
    expect(sinNbsp(fila!.textContent)).toContain("Utilidad US$ 48,00");
    expect(screen.getByRole("link", { name: "Garantías" })).toHaveAttribute("href", "/garantias");

    await usuario.selectOptions(await screen.findByLabelText("Técnico"), "Victor");
    await usuario.selectOptions(screen.getByLabelText("Garantía"), "Vencida");
    await waitFor(() => {
      expect(consultas.at(-1)?.get("estadoGarantia")).toBe("VENCIDA");
    });
    expect(consultas.at(-1)?.get("tecnicoId")).toBe("2");
  });

  it("Nueva instalación enlaza al listado", async () => {
    renderizarApp({ ruta: "/instalaciones/nueva" });
    expect(await screen.findByRole("link", { name: "Ver instalaciones" })).toHaveAttribute(
      "href",
      "/instalaciones",
    );
  });
});

describe("Detalle de la instalación (RF-121, RF-122)", () => {
  it("muestra el trabajo, el material, las garantías, el cobro y las fotos", async () => {
    servirInstalacion(instalacion());
    renderizarApp({ ruta: "/instalaciones/80" });

    expect(await screen.findByRole("heading", { level: 1, name: "Instalación I-0001" })).toBeVisible();
    expect(screen.getAllByText("Instalación de 2 cámaras")[0]).toBeVisible();
    const garantias = screen.getByRole("region", { name: "Garantías" });
    expect(garantias).toHaveTextContent("Mano de obra (3 meses) · hasta 01/01/2027Vigente");
    expect(garantias).toHaveTextContent("Condiciones: La garantía no cubre daños por mal uso.");
    const cobro = screen.getByRole("region", { name: "Cobro" });
    expect(sinNbsp(cobro.textContent)).toContain("Mano de obraUS$ 40,00");
    expect(sinNbsp(cobro.textContent)).toContain("Costo del material (guardado al instalar)US$ 17,50");
    expect(screen.getByRole("heading", { name: "Antes · 1" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Ver foto 1 de Antes" })).toBeVisible();
  });

  it("agrega y quita fotos", async () => {
    servirInstalacion(instalacion());
    let grupo: string | null = null;
    servidor.use(
      http.post("/api/v1/instalaciones/{id}/fotos", ({ request, response }) => {
        grupo = new URL(request.url).searchParams.get("grupo");
        return response(200).json(
          instalacion({
            fotos: {
              antes: [{ id: 1, url: "http://archivos.prueba/antes-1.webp" }],
              durante: [],
              despues: [{ id: 2, url: "http://archivos.prueba/despues-1.webp" }],
            },
          }),
        );
      }),
      http.delete("/api/v1/instalaciones/{id}/fotos/{fotoId}", ({ response }) =>
        response(200).json(instalacion({ fotos: { antes: [], durante: [], despues: [] } })),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/instalaciones/80" });

    await usuario.upload(
      await screen.findByLabelText("Tomar foto · Después"),
      new File(["x"], "d.jpg", { type: "image/jpeg" }),
    );
    expect(await screen.findByText("Foto agregada")).toBeVisible();
    expect(grupo).toBe("DESPUES");
    expect(screen.getByRole("heading", { name: "Después · 1" })).toBeVisible();

    await usuario.click(screen.getByRole("button", { name: "Quitar foto 1 de Antes" }));
    expect(await screen.findByText("Foto quitada")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Antes · 0" })).toBeVisible();
  });

  it("si un grupo ya tiene 30 fotos, el backend lo rechaza y se muestra en el grupo", async () => {
    servirInstalacion(instalacion());
    servidor.use(
      http.post("/api/v1/instalaciones/{id}/fotos", () =>
        problema(422, "FOTOS_MAXIMAS", "El grupo Durante ya tiene 30 fotos."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/instalaciones/80" });
    await usuario.upload(
      await screen.findByLabelText("Agregar fotos · Durante"),
      new File(["x"], "d.jpg", { type: "image/jpeg" }),
    );
    const grupo = screen.getByRole("heading", { name: "Durante · 0" }).closest("section")!;
    expect(await within(grupo).findByText("El grupo Durante ya tiene 30 fotos.")).toBeVisible();
  });

  it("edita lo descriptivo con la versión y anula con motivo", async () => {
    servirInstalacion(instalacion());
    let edicion: unknown;
    let motivo: unknown;
    servidor.use(
      http.put("/api/v1/instalaciones/{id}", async ({ request, response }) => {
        edicion = await request.json();
        return response(200).json(instalacion({ descripcion: "Instalación de 3 cámaras", version: 1 }));
      }),
      http.post("/api/v1/instalaciones/{id}/anular", async ({ request, response }) => {
        motivo = await request.json();
        return response(200).json(
          instalacion({
            estado: "ANULADA",
            version: 2,
            anulacion: { motivo: "Error de registro", usuario: "Victor", fecha: "2026-10-06T16:00:00Z" },
          }),
        );
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/instalaciones/80" });

    const descripcion = await screen.findByRole("textbox", { name: "Descripción del trabajo" });
    await usuario.clear(descripcion);
    await usuario.type(descripcion, "Instalación de 3 cámaras");
    await usuario.click(await screen.findByRole("checkbox", { name: "Victor" }));
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Cambios guardados")).toBeVisible();
    expect(edicion).toEqual({
      direccion: "Carrera 5 # 1-10",
      tecnicos: [1, 2],
      descripcion: "Instalación de 3 cámaras",
      condicionesGarantia: "La garantía no cubre daños por mal uso.",
      observaciones: "",
      monedasComprobante: [],
      version: 0,
    });

    await usuario.click(screen.getByRole("button", { name: "Anular" }));
    const dialogo = await screen.findByRole("dialog", { name: "¿Anular la instalación I-0001?" });
    expect(dialogo).toHaveTextContent("Las fotos se conservan");
    await usuario.type(within(dialogo).getByLabelText("Motivo de la anulación"), "Error de registro");
    await usuario.click(within(dialogo).getByRole("button", { name: "Anular" }));
    expect(await screen.findByText("Instalación anulada")).toBeVisible();
    expect(motivo).toEqual({ motivo: "Error de registro" });
    // Las fotos de una anulada se pueden seguir quitando (P-42).
    expect(screen.getByRole("button", { name: "Quitar foto 1 de Antes" })).toBeVisible();
  });
});
