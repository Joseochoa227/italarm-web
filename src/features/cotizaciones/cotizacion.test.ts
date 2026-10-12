import { conversion, cotizacion } from "@/test/datos";

import { cantidadCotizada, cobroDeConversion, leerCotizacionId, lineasDeConversion } from "./conversion";
import { COTIZACION_VACIA, entradaDeCotizacion, esquemaCotizacion, validezDe } from "./schemas/cotizacion";

const base = { ...COTIZACION_VACIA, clienteId: 20, validezDias: "15" as const };
const cable = {
  productoId: 11,
  nombre: "Cable UTP",
  codigo: "CAB-UTP",
  abreviatura: "m",
  admiteDecimales: true,
  controlaSerial: false,
  cantidad: "20,5",
  precio: "",
  seriales: [],
};
const errores = (r: ReturnType<typeof esquemaCotizacion.safeParse>) =>
  r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);

describe("Esquema de la cotización", () => {
  it("una de instalación puede ser solo de mano de obra; una de venta, no", () => {
    expect(esquemaCotizacion.parse({ ...base, descripcion: "Revisión", manoDeObra: "30" })).toEqual({
      tipo: "INSTALACION",
      clienteId: 20,
      validezDias: 15,
      moneda: "USD",
      lineas: [],
      descripcion: "Revisión",
      manoDeObra: "30",
      monedasComprobante: [],
    });
    expect(errores(esquemaCotizacion.safeParse({ ...base, descripcion: "Revisión" }))).toEqual([
      "manoDeObra: Agrega ítems o la mano de obra.",
    ]);
    expect(errores(esquemaCotizacion.safeParse({ ...base, tipo: "VENTA", manoDeObra: "30" }))).toEqual([
      "lineas: Agrega al menos un producto.",
    ]);
  });

  it("las de venta no envían descripción ni mano de obra; quitan la moneda propia del comprobante", () => {
    const datos = esquemaCotizacion.parse({
      ...base,
      tipo: "VENTA",
      descripcion: "No se envía",
      manoDeObra: "10",
      lineas: [{ ...cable, precio: "0,8" }],
      descuentoTipo: "PORCENTAJE",
      descuentoValor: "10",
      monedasComprobante: ["USD", "COP"],
      observaciones: " Pago de contado ",
    });
    expect(datos).toEqual({
      tipo: "VENTA",
      clienteId: 20,
      validezDias: 15,
      moneda: "USD",
      lineas: [{ productoId: 11, cantidad: "20.5", precioUnitario: "0.8" }],
      descuentoTipo: "PORCENTAJE",
      descuentoValor: "10",
      monedasComprobante: ["COP"],
      observaciones: "Pago de contado",
    });
  });

  it("valida la mano de obra, el descuento y la cantidad de los productos con serial", () => {
    expect(errores(esquemaCotizacion.safeParse({ ...base, descripcion: "x", manoDeObra: "abc" }))[0]).toMatch(
      /^manoDeObra: /,
    );
    expect(
      errores(
        esquemaCotizacion.safeParse({
          ...base,
          tipo: "VENTA",
          lineas: [cable],
          descuentoTipo: "PORCENTAJE",
          descuentoValor: "120",
        }),
      ),
    ).toEqual(["descuentoValor: El porcentaje va de 0 a 100."]);
    expect(
      errores(
        esquemaCotizacion.safeParse({
          ...base,
          tipo: "VENTA",
          lineas: [{ ...cable, controlaSerial: true, cantidad: "1,5" }],
        }),
      )[0],
    ).toMatch(/^lineas\.0\.cantidad: /);
  });

  it("la validez por defecto es la de Configuración si es 8, 15 o 30 días", () => {
    expect(validezDe(30)).toBe("30");
    expect(validezDe(20)).toBe("15");
    expect(validezDe(undefined)).toBe("15");
  });

  it("al editar, toma los valores guardados con los precios cotizados", () => {
    const entrada = entradaDeCotizacion(
      cotizacion({
        tipo: "VENTA",
        moneda: "COP",
        validezDias: 45,
        descuentoTipo: "VALOR",
        descuentoValor: "5000.0000",
        monedasComprobante: ["USD"],
        resumen: {},
        lineas: [{ descripcion: "Sin producto" }, ...(cotizacion().lineas ?? [])],
      }),
    );
    expect(entrada).toMatchObject({
      tipo: "VENTA",
      validezDias: "15",
      moneda: "COP",
      descuentoTipo: "VALOR",
      descuentoValor: "5000",
      manoDeObra: "",
      monedasComprobante: ["USD"],
    });
    expect(entrada.lineas).toHaveLength(1);
    expect(entrada.lineas[0]).toMatchObject({ productoId: 10, cantidad: "4", precio: "25,5" });
    expect(entradaDeCotizacion(cotizacion({ descuentoTipo: "NINGUNO" })).descuentoValor).toBe("");
  });
});

describe("Conversión de una cotización", () => {
  it("lee el id de la URL", () => {
    expect(leerCotizacionId(new URLSearchParams("cotizacionId=90"))).toBe(90);
    expect(leerCotizacionId(new URLSearchParams("cotizacionId=abc"))).toBeNull();
    expect(leerCotizacionId(new URLSearchParams(""))).toBeNull();
  });

  it("arma las líneas y el cobro con lo cotizado", () => {
    const c = conversion({
      descuentoTipo: "PORCENTAJE",
      descuentoValor: "5.0000",
      lineas: [...(conversion().lineas ?? []), { nombre: "Sin id" }],
    });
    expect(lineasDeConversion(c)).toHaveLength(2);
    expect(cobroDeConversion(c)).toMatchObject({
      clienteId: 20,
      moneda: "USD",
      descuentoTipo: "PORCENTAJE",
      descuentoValor: "5",
      monedasComprobante: ["COP"],
    });
    expect(cobroDeConversion(conversion({ monedasComprobante: [] }))).toMatchObject({
      descuentoTipo: "NINGUNO",
      descuentoValor: "",
      observaciones: "",
    });
    expect(cantidadCotizada(c, 10)).toBe("4 und");
    expect(cantidadCotizada(c, 99)).toBeUndefined();
    expect(cantidadCotizada(undefined, 10)).toBeUndefined();
  });
});
