import { screen, waitFor, within } from "@testing-library/react";

import { cliente, pagina } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, servidor } from "@/test/servidor";

const GARANTIAS = [
  {
    clase: "MANO_OBRA",
    tipo: "INSTALACION",
    estado: "POR_VENCER",
    fecha: "2026-10-01",
    vencimiento: "2027-01-01",
    diasRestantes: 12,
    cliente: "Ferretería El Tornillo",
    clienteId: 20,
    documento: { tipo: "INSTALACION", id: 80, consecutivo: "I-0001" },
  },
  {
    clase: "EQUIPO",
    tipo: "VENTA",
    estado: "VENCIDA",
    fecha: "2026-06-01",
    vencimiento: "2026-09-01",
    diasRestantes: -37,
    cliente: "Ana Gómez",
    clienteId: 21,
    producto: "Cámara domo 2MP",
    serial: "SN-0001",
    serialId: 500,
    documento: { tipo: "VENTA", id: 60, consecutivo: "V-0001" },
  },
] as const;

describe("Garantías (RF-123 a RF-125)", () => {
  it("lista las garantías con estado, vencimiento y documento, y filtra por estado, tipo y serial", async () => {
    const consultas: URLSearchParams[] = [];
    servidor.use(
      http.get("/api/v1/garantias", ({ request, response }) => {
        consultas.push(new URL(request.url).searchParams);
        return response(200).json(pagina([...GARANTIAS]));
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/garantias" });

    const [manoObra, equipo] = within(await screen.findByRole("list", { name: "Garantías" })).getAllByRole(
      "listitem",
    );
    expect(manoObra).toHaveTextContent("Por vencerMano de obra");
    expect(manoObra).toHaveTextContent("Vence el 01/01/2027quedan 12 días");
    expect(within(manoObra!).getByRole("link", { name: "I-0001" })).toHaveAttribute(
      "href",
      "/instalaciones/80",
    );
    expect(equipo).toHaveTextContent("VencidaEquipo · Cámara domo 2MP");
    expect(equipo).toHaveTextContent("venció hace 37 días");
    expect(within(equipo!).getByRole("link", { name: "SN-0001" })).toHaveAttribute("href", "/seriales/500");

    await usuario.click(screen.getByRole("radio", { name: "Por vencer" }));
    await usuario.click(screen.getByRole("radio", { name: "Instalación" }));
    await usuario.type(screen.getByRole("searchbox", { name: "Buscar por serial" }), "sn-01");
    await waitFor(() => {
      expect(consultas.at(-1)?.get("serial")).toBe("SN-01");
    });
    expect(consultas.at(-1)?.get("estado")).toBe("POR_VENCER");
    expect(consultas.at(-1)?.get("tipo")).toBe("INSTALACION");
  });

  it("registra un reclamo sobre un serial y escribe la solución después (P-45)", async () => {
    let cuerpo: unknown;
    let solucion: unknown;
    let reclamos: unknown[] = [];
    servidor.use(
      http.get("/api/v1/garantias", ({ response }) => response(200).json(pagina([GARANTIAS[1]]))),
      http.get("/api/v1/garantias/reclamos", ({ response }) => response(200).json(reclamos as never)),
      http.post("/api/v1/garantias/reclamos", async ({ request, response }) => {
        cuerpo = await request.json();
        reclamos = [
          {
            id: 9,
            fecha: "2026-10-08",
            problema: "No enciende",
            enGarantia: false,
            serial: "SN-0001",
            documento: "V-0001",
            registradoPor: "Jose Ochoa",
            registradoEn: "2026-10-08T15:00:00Z",
            version: 0,
          },
        ];
        return response(201).json(reclamos[0] as never);
      }),
      http.put("/api/v1/garantias/reclamos/{id}", async ({ request, response }) => {
        solucion = await request.json();
        reclamos = [{ ...(reclamos[0] as object), solucion: "Se cambió la fuente", version: 1 }];
        return response(200).json(reclamos[0] as never);
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/garantias?cliente=21&clienteNombre=Ana%20G%C3%B3mez" });

    await usuario.click(await screen.findByRole("button", { name: "Registrar reclamo" }));
    const dialogo = await screen.findByRole("dialog", { name: "Reclamo · Cámara domo 2MP · SN-0001" });
    expect(dialogo).toHaveTextContent("ajuste de salida con motivo Garantía");
    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar" }));
    expect(within(dialogo).getByText("Describe el problema.")).toBeVisible();
    await usuario.type(within(dialogo).getByLabelText("Problema"), "No enciende");
    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Reclamo registrado")).toBeVisible();
    expect(cuerpo).toMatchObject({ serialId: 500, problema: "No enciende" });

    const lista = await screen.findByRole("list", { name: "Reclamos" });
    expect(within(lista).getByText("Fuera de garantía")).toBeVisible();
    expect(within(lista).getByText("Sin solución todavía")).toBeVisible();
    await usuario.click(within(lista).getByRole("button", { name: "Escribir solución" }));
    const editar = await screen.findByRole("dialog", { name: "Solución del reclamo" });
    await usuario.type(within(editar).getByLabelText("Solución"), "Se cambió la fuente");
    await usuario.click(within(editar).getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Solución guardada")).toBeVisible();
    expect(solucion).toEqual({ solucion: "Se cambió la fuente", version: 0 });
    expect(await within(lista).findByText("Solución: Se cambió la fuente")).toBeVisible();
  });

  it("el cliente enlaza a sus garantías (W-10)", async () => {
    servidor.use(
      http.get("/api/v1/clientes/{id}", ({ response }) => response(200).json(cliente())),
      http.get("/api/v1/clientes/{id}/historial", ({ response }) =>
        response(200).json({ clienteId: 20, compras: 0, instalaciones: 0, movimientos: [] }),
      ),
    );
    renderizarApp({ ruta: "/clientes/20" });
    expect(await screen.findByRole("link", { name: "Ver garantías" })).toHaveAttribute(
      "href",
      "/garantias?cliente=20&clienteNombre=Ferreter%C3%ADa%20El%20Tornillo",
    );
  });
});
