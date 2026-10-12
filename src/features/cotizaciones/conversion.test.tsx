import { screen, waitFor, within } from "@testing-library/react";

import {
  cliente,
  conversion,
  cotizacion,
  instalacion,
  pagina,
  serial,
  venta,
  vistaPreviaVenta,
} from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

interface Cuerpo {
  moneda: "USD" | "COP" | "VES";
  lineas?: { productoId: number; cantidad?: string; seriales?: string[]; precioUnitario?: string }[];
  manoDeObra?: string;
}

/** Vista previa de la venta o de la instalación; `sinStock` simula 120 m de cable con menos en bodega. */
function servir(opciones: { conversion?: ReturnType<typeof conversion>; sinStock?: boolean } = {}) {
  const previas: Cuerpo[] = [];
  const pedidas = { conversion: 0 };
  const responder = (cuerpo: Cuerpo) => {
    const previa = vistaPreviaVenta({ moneda: cuerpo.moneda, lineas: cuerpo.lineas ?? [] });
    return {
      ...previa,
      puedeGuardar: !opciones.sinStock,
      lineas: (previa.lineas ?? []).map((l) =>
        opciones.sinStock && l.productoId === 11
          ? { ...l, avisoStock: "Stock insuficiente · quedan 100 m" }
          : l,
      ),
    };
  };
  servidor.use(
    http.get("/api/v1/cotizaciones/{id}/conversion", ({ response }) => {
      pedidas.conversion++;
      return response(200).json(opciones.conversion ?? conversion());
    }),
    http.get("/api/v1/clientes/{id}", ({ response }) => response(200).json(cliente())),
    http.get("/api/v1/usuarios/tecnicos", ({ response }) =>
      response(200).json([{ id: 1, nombre: "Jose Ochoa" }]),
    ),
    http.get("/api/v1/inventario/productos/{id}/seriales", ({ response }) =>
      response(200).json([1, 2, 3, 4].map((n) => serial({ id: 500 + n, numero: `SN-000${String(n)}` }))),
    ),
    http.post("/api/v1/instalaciones/vista-previa", async ({ request, response }) => {
      const cuerpo = (await request.json()) as Cuerpo;
      previas.push(cuerpo);
      return response(200).json(responder(cuerpo));
    }),
    http.post("/api/v1/ventas/vista-previa", async ({ request, response }) => {
      const cuerpo = (await request.json()) as Cuerpo;
      previas.push(cuerpo);
      return response(200).json(responder(cuerpo));
    }),
  );
  return { previas, pedidas };
}

describe("Convertir una cotización aprobada (RF-93 a RF-96)", () => {
  it("abre la instalación con cliente, ítems, precios y mano de obra, y la guarda con la cotización (CP-22)", async () => {
    const { pedidas } = servir({
      conversion: conversion({
        avisos: [
          {
            tipo: "PRECIO",
            productoId: 10,
            mensaje: "El precio de Cámara domo 2MP cambió desde la cotización.",
          },
        ],
      }),
    });
    let guardada: unknown;
    servidor.use(
      http.post("/api/v1/instalaciones", async ({ request, response }) => {
        guardada = await request.json();
        return response(201).json(instalacion({ cotizacion: { id: 90, consecutivo: "COT-0001" } }));
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/instalaciones/nueva?cotizacionId=90" });

    // La primera prueba también espera la carga diferida del formulario.
    expect(
      await screen.findByRole("link", { name: "Desde la cotización COT-0001" }, { timeout: 5000 }),
    ).toHaveAttribute("href", "/cotizaciones/90");
    expect(screen.getByText("El precio de Cámara domo 2MP cambió desde la cotización.")).toBeVisible();
    // El cliente no se cambia (P-54).
    expect(await screen.findByText("Se le aplicará el precio instalador")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Cambiar" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Dirección de la instalación")).toHaveValue("Carrera 5 # 1-10");
    expect(screen.getByLabelText("Descripción del trabajo")).toHaveValue("Instalación de 4 cámaras");
    expect(screen.getByLabelText("Mano de obra")).toHaveValue("40");
    expect(screen.getByLabelText("Precio unitario de Cámara domo 2MP")).toHaveValue("24");
    expect(screen.getByLabelText("Precio unitario de Cable UTP")).toHaveValue("0,8");
    expect(screen.getByLabelText("Cantidad de Cable UTP")).toHaveValue("120");
    expect(screen.getByText("Cotizado: 4 und")).toBeVisible();

    for (const n of [1, 2, 3, 4]) {
      await usuario.click(
        await screen.findByRole("button", { name: `Serial SN-000${String(n)} de Cámara domo 2MP` }),
      );
    }
    await usuario.click(screen.getByRole("button", { name: "Guardar instalación" }));

    expect(await screen.findByText("Instalación I-0001 registrada")).toBeVisible();
    // Ya convertida, la conversión no se vuelve a pedir (respondería COTIZACION_NO_CONVERTIBLE).
    expect(pedidas.conversion).toBe(1);
    expect(guardada).toMatchObject({
      cotizacionId: 90,
      clienteId: 20,
      direccion: "Carrera 5 # 1-10",
      descripcion: "Instalación de 4 cámaras",
      manoDeObra: "40",
      monedasComprobante: ["COP"],
      lineas: [
        { productoId: 10, seriales: ["SN-0001", "SN-0002", "SN-0003", "SN-0004"], precioUnitario: "24" },
        { productoId: 11, cantidad: "120", precioUnitario: "0.8" },
      ],
    });
  });

  it("sin stock suficiente no deja guardar hasta ajustar la cantidad (CP-23)", async () => {
    servir({ conversion: conversion({ puedeGuardar: false }), sinStock: true });
    renderizarApp({ ruta: "/instalaciones/nueva?cotizacionId=90" });

    expect(
      await screen.findByText(
        "No hay stock suficiente para todo lo cotizado: ajusta las cantidades antes de guardar.",
      ),
    ).toBeVisible();
    expect(await screen.findByText("Stock insuficiente · quedan 100 m")).toBeVisible();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Guardar instalación" })).toBeDisabled();
    });
  });

  it("si la cotización dejó de estar aprobada al guardar, lo explica (COTIZACION_NO_CONVERTIBLE)", async () => {
    servir({ conversion: conversion({ tipo: "VENTA", lineas: conversion().lineas?.slice(1) ?? [] }) });
    servidor.use(
      http.post("/api/v1/ventas", () =>
        problema(422, "COTIZACION_NO_CONVERTIBLE", "La cotización COT-0001 ya fue convertida."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/ventas/nueva?cotizacionId=90" });

    expect(await screen.findByRole("link", { name: "Desde la cotización COT-0001" })).toBeVisible();
    expect(await screen.findByLabelText("Cantidad de Cable UTP")).toHaveValue("120");
    await usuario.click(screen.getByRole("button", { name: "Guardar venta" }));

    expect(await screen.findByText("La cotización COT-0001 ya fue convertida.")).toBeVisible();
  });

  it("no abre la conversión desde el formulario del otro tipo ni la de una cotización no aprobada", async () => {
    servir();
    renderizarApp({ ruta: "/ventas/nueva?cotizacionId=90" });

    expect(await screen.findByText("Esta cotización es de Instalación.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver la cotización" })).toHaveAttribute(
      "href",
      "/cotizaciones/90",
    );
    expect(screen.queryByRole("button", { name: "Guardar venta" })).not.toBeInTheDocument();
  });

  it("muestra el error del backend si la cotización no se puede convertir", async () => {
    servidor.use(
      http.get("/api/v1/cotizaciones/{id}/conversion", () =>
        problema(422, "COTIZACION_NO_CONVERTIBLE", "La cotización COT-0001 no está aprobada."),
      ),
    );
    renderizarApp({ ruta: "/instalaciones/nueva?cotizacionId=90" });

    expect(await screen.findByText("La cotización COT-0001 no está aprobada.")).toBeVisible();
  });

  it("la venta que vino de una cotización la enlaza y, al anularla, avisa que vuelve a Aprobada (CP-24)", async () => {
    servidor.use(
      http.get("/api/v1/ventas/{id}", ({ response }) =>
        response(200).json(venta({ cotizacion: { id: 90, consecutivo: "COT-0001" } })),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/ventas/60" });

    expect(await screen.findByRole("link", { name: "COT-0001" })).toHaveAttribute("href", "/cotizaciones/90");
    await usuario.click(screen.getByRole("button", { name: "Anular" }));
    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByText(/La cotización COT-0001 vuelve a Aprobada\./)).toBeVisible();
  });

  it("la cotización convertida enlaza el documento generado", async () => {
    servidor.use(
      http.get("/api/v1/cotizaciones/{id}", ({ response }) =>
        response(200).json(
          cotizacion({
            estado: "CONVERTIDA",
            documentoGenerado: { tipo: "INSTALACION", id: 80, consecutivo: "I-0001", fecha: "2026-10-07" },
          }),
        ),
      ),
      http.get("/api/v1/clientes", ({ response }) => response(200).json(pagina([]))),
    );
    renderizarApp({ ruta: "/cotizaciones/90" });

    expect(await screen.findByRole("link", { name: "Convertida en la instalación I-0001" })).toHaveAttribute(
      "href",
      "/instalaciones/80",
    );
    expect(screen.queryByRole("button", { name: "Rechazar" })).not.toBeInTheDocument();
  });
});
