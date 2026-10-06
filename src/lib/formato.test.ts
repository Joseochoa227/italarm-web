import {
  formatearCantidad,
  formatearDinero,
  formatearDineroDe,
  formatearFecha,
  formatearFechaHora,
  formatearFechaLarga,
} from "./formato";

/** Los formatos usan espacio no separable; en las pruebas se escribe como espacio normal. */
const sinNbsp = (texto: string) => texto.replaceAll(" ", " ");

describe("formatearDinero (BF-07)", () => {
  it("COP sin decimales: $ 1.250.000", () => {
    expect(sinNbsp(formatearDinero("1250000.0000", "COP"))).toBe("$ 1.250.000");
  });

  it("USD con dos decimales: US$ 1.939,04", () => {
    expect(sinNbsp(formatearDinero("1939.04", "USD"))).toBe("US$ 1.939,04");
    expect(sinNbsp(formatearDinero("19.5000", "USD"))).toBe("US$ 19,50");
  });

  it("VES con el símbolo Bs: Bs 1.234,56", () => {
    expect(sinNbsp(formatearDinero("1234.56", "VES"))).toBe("Bs 1.234,56");
    expect(sinNbsp(formatearDinero("-1234.5", "VES"))).toBe("-Bs 1.234,50");
  });

  it("no pierde precisión con valores de más de 15 dígitos", () => {
    expect(sinNbsp(formatearDinero("12345678901234567.89", "USD"))).toBe("US$ 12.345.678.901.234.567,89");
  });

  it("separa el símbolo con un espacio que no se parte", () => {
    expect(formatearDinero("1", "COP")).toContain(" ");
  });

  it("rechaza textos que no son decimales", () => {
    expect(() => formatearDinero("1,5", "USD")).toThrow("Valor decimal inválido");
    expect(() => formatearDinero("abc", "COP")).toThrow();
  });

  it("formatea el objeto Dinero del contrato y usa una raya si falta un dato", () => {
    expect(sinNbsp(formatearDineroDe({ monto: "25.5000", moneda: "USD" }))).toBe("US$ 25,50");
    expect(formatearDineroDe({ monto: "25.5" })).toBe("—");
  });
});

describe("formatearCantidad", () => {
  it("muestra decimales solo cuando los hay (P-09)", () => {
    expect(formatearCantidad("12.5")).toBe("12,5");
    expect(formatearCantidad("0")).toBe("0");
    expect(formatearCantidad("1500")).toBe("1.500");
  });
});

describe("fechas", () => {
  it("dd/mm/aaaa sin correr el día por la zona horaria", () => {
    expect(formatearFecha("2026-10-06")).toBe("06/10/2026");
    expect(formatearFecha("2026-01-01")).toBe("01/01/2026");
  });

  it("rechaza fechas con otro formato", () => {
    expect(() => formatearFecha("06/10/2026")).toThrow("Fecha inválida");
  });

  it("fecha y hora en la zona de Colombia", () => {
    expect(formatearFechaHora("2026-10-06T03:30:00Z")).toBe("05/10/2026 22:30");
    expect(formatearFechaHora(new Date("2026-10-06T17:05:00Z"))).toBe("06/10/2026 12:05");
    expect(() => formatearFechaHora("no")).toThrow("Instante inválido");
  });

  it("fecha larga con el día de la semana en mayúscula", () => {
    expect(formatearFechaLarga(new Date("2026-10-06T15:00:00Z"))).toBe("Martes 06/10/2026");
  });
});
