import { screen, waitFor } from "@testing-library/react";
import { HttpResponse } from "msw";

import { hoyBogota } from "@/lib/fechas";
import { pagina, productoDetalle, proveedor } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, servidor } from "@/test/servidor";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const vacioListado = { desde: "2026-10-01", hasta: "2026-10-31", totalesPorMoneda: [] };

function vigilarDescargas() {
  const nombres: string[] = [];
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:xlsx");
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    nombres.push(this.download);
  });
  return nombres;
}

/** Responde el Excel de `ruta` con `nombre` y guarda la consulta que recibió. */
function servirExcel(ruta: string, nombre: string) {
  const recibido: { consulta?: URLSearchParams } = {};
  servidor.use(
    http.get(ruta as "/api/v1/ventas/excel", ({ request }) => {
      recibido.consulta = new URL(request.url).searchParams;
      return new HttpResponse("xlsx", {
        headers: { "Content-Type": XLSX, "Content-Disposition": `attachment; filename="${nombre}"` },
      }) as never;
    }),
  );
  return recibido;
}

describe("Botón Excel en los listados (RF-144, RNF-06, P-62)", () => {
  it("inventario: exporta con la búsqueda y la categoría de la pantalla", async () => {
    servidor.use(
      http.get("/api/v1/inventario", ({ response }) =>
        response(200).json({ productos: pagina([]), totalProductos: 0, valorTotal: {} }),
      ),
    );
    const recibido = servirExcel("/api/v1/inventario/excel", "inventario-2026-10-06.xlsx");
    const nombres = vigilarDescargas();
    const { usuario } = renderizarApp({ ruta: "/inventario?buscar=camara&categoria=1" });

    await usuario.click(await screen.findByRole("button", { name: "Excel" }));
    await waitFor(() => {
      expect(nombres).toEqual(["inventario-2026-10-06.xlsx"]);
    });
    expect(recibido.consulta?.get("buscar")).toBe("camara");
    expect(recibido.consulta?.get("categoriaId")).toBe("1");
    expect(recibido.consulta?.get("page")).toBeNull();
  });

  it("ventas: exporta con el cliente y las fechas, sin paginar", async () => {
    servidor.use(
      http.get("/api/v1/ventas", ({ response }) =>
        response(200).json({ ...vacioListado, ventas: pagina([]) }),
      ),
    );
    const recibido = servirExcel("/api/v1/ventas/excel", "ventas-2026-10-06.xlsx");
    const nombres = vigilarDescargas();
    const { usuario } = renderizarApp({
      ruta: "/ventas?cliente=20&clienteNombre=Ana&desde=2026-10-01&pagina=2",
    });

    await usuario.click(await screen.findByRole("button", { name: "Excel" }));
    await waitFor(() => {
      expect(nombres).toEqual(["ventas-2026-10-06.xlsx"]);
    });
    expect(recibido.consulta?.get("clienteId")).toBe("20");
    expect(recibido.consulta?.get("desde")).toBe("2026-10-01");
    expect(recibido.consulta?.get("page")).toBeNull();
  });

  it("instalaciones: exporta con el estado de la garantía", async () => {
    servidor.use(
      http.get("/api/v1/usuarios/tecnicos", ({ response }) => response(200).json([])),
      http.get("/api/v1/instalaciones", ({ response }) =>
        response(200).json({ ...vacioListado, instalaciones: pagina([]) }),
      ),
    );
    const recibido = servirExcel("/api/v1/instalaciones/excel", "instalaciones.xlsx");
    const nombres = vigilarDescargas();
    const { usuario } = renderizarApp({ ruta: "/instalaciones?garantia=POR_VENCER" });

    await usuario.click(await screen.findByRole("button", { name: "Excel" }));
    await waitFor(() => {
      expect(nombres).toEqual(["instalaciones.xlsx"]);
    });
    expect(recibido.consulta?.get("estadoGarantia")).toBe("POR_VENCER");
  });

  it("cotizaciones: exporta con el estado y Por vencer", async () => {
    servidor.use(http.get("/api/v1/cotizaciones", ({ response }) => response(200).json(pagina([]))));
    const recibido = servirExcel("/api/v1/cotizaciones/excel", "cotizaciones.xlsx");
    const nombres = vigilarDescargas();
    const { usuario } = renderizarApp({ ruta: "/cotizaciones?estado=EN_EVALUACION&porVencer=si" });

    await usuario.click(await screen.findByRole("button", { name: "Excel" }));
    await waitFor(() => {
      expect(nombres).toEqual(["cotizaciones.xlsx"]);
    });
    expect(recibido.consulta?.get("estado")).toBe("EN_EVALUACION");
    expect(recibido.consulta?.get("porVencer")).toBe("true");
  });

  it("garantías: exporta con el estado y el serial", async () => {
    servidor.use(http.get("/api/v1/garantias", ({ response }) => response(200).json(pagina([]))));
    const recibido = servirExcel("/api/v1/garantias/excel", "garantias.xlsx");
    const nombres = vigilarDescargas();
    const { usuario } = renderizarApp({ ruta: "/garantias?estado=POR_VENCER&serial=SN-0001" });

    await usuario.click(await screen.findByRole("button", { name: "Excel" }));
    await waitFor(() => {
      expect(nombres).toEqual(["garantias.xlsx"]);
    });
    expect(recibido.consulta?.get("estado")).toBe("POR_VENCER");
    expect(recibido.consulta?.get("serial")).toBe("SN-0001");
  });

  it("compras: exporta con el proveedor", async () => {
    servidor.use(
      http.get("/api/v1/proveedores", ({ response }) => response(200).json(pagina([proveedor()]))),
      http.get("/api/v1/compras", ({ response }) =>
        response(200).json({ ...vacioListado, compras: pagina([]) }),
      ),
    );
    const recibido = servirExcel("/api/v1/compras/excel", "compras.xlsx");
    const nombres = vigilarDescargas();
    const { usuario } = renderizarApp({ ruta: "/compras?proveedor=30" });

    await usuario.click(await screen.findByRole("button", { name: "Excel" }));
    await waitFor(() => {
      expect(nombres).toEqual(["compras.xlsx"]);
    });
    expect(recibido.consulta?.get("proveedorId")).toBe("30");
  });

  it("kárdex: exporta el del producto; sin el nombre del backend usa uno propio con la fecha", async () => {
    servidor.use(
      http.get("/api/v1/inventario/productos/{id}", ({ response }) => response(200).json(productoDetalle())),
      http.get("/api/v1/inventario/productos/{id}/kardex", ({ response }) => response(200).json(pagina([]))),
      http.get("/api/v1/inventario/productos/{id}/historial-costo", ({ response }) => response(200).json([])),
      http.get(
        "/api/v1/inventario/productos/{id}/kardex/excel",
        () => new HttpResponse("xlsx", { headers: { "Content-Type": XLSX } }) as never,
      ),
    );
    const nombres = vigilarDescargas();
    const { usuario } = renderizarApp({ ruta: "/inventario/productos/10" });

    await usuario.click(await screen.findByRole("button", { name: "Excel" }));
    await waitFor(() => {
      expect(nombres).toEqual([`kardex-CAM-D2-${hoyBogota()}.xlsx`]);
    });
  });
});

describe("Ver compras desde Registrar compra (F6-01, W-14)", () => {
  it("lleva al listado de compras", async () => {
    servidor.use(
      http.get("/api/v1/proveedores", ({ response }) => response(200).json(pagina([proveedor()]))),
    );
    renderizarApp({ ruta: "/compras/nueva", escritorio: false });

    expect(await screen.findByRole("link", { name: "Ver compras" })).toHaveAttribute("href", "/compras");
  });
});
