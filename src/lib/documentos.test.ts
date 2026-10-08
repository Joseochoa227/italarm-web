import { nombreDeArchivo } from "./descargas";
import { rutaDocumento } from "./documentos";

describe("rutaDocumento", () => {
  it("lleva al detalle de compras, ajustes y a la carga inicial", () => {
    expect(rutaDocumento({ tipo: "COMPRA", id: 3, consecutivo: "C-0003" })).toBe("/compras/3");
    expect(rutaDocumento({ tipo: "AJUSTE", id: 7, consecutivo: "AJ-007" })).toBe("/inventario/ajustes/7");
    expect(rutaDocumento({ tipo: "INVENTARIO_INICIAL", id: 1, consecutivo: "II-001" })).toBe(
      "/configuracion?pestana=carga",
    );
  });

  it("instalaciones y documentos sin id no tienen enlace todavía; las ventas sí", () => {
    expect(rutaDocumento({ tipo: "VENTA", id: 1 })).toBe("/ventas/1");
    expect(rutaDocumento({ tipo: "INSTALACION", id: 1 })).toBeNull();
    expect(rutaDocumento({ tipo: "COMPRA" })).toBeNull();
    expect(rutaDocumento(undefined)).toBeNull();
  });
});

describe("nombreDeArchivo", () => {
  it("lee el nombre de Content-Disposition", () => {
    expect(nombreDeArchivo('attachment; filename="plantilla.xlsx"', "x.xlsx")).toBe("plantilla.xlsx");
    expect(nombreDeArchivo("attachment; filename*=UTF-8''carga%20inicial.xlsx", "x.xlsx")).toBe(
      "carga inicial.xlsx",
    );
    expect(nombreDeArchivo(null, "x.xlsx")).toBe("x.xlsx");
  });
});
