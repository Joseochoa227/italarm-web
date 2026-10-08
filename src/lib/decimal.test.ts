import {
  compararDecimales,
  decimalAEdicion,
  leerDecimal,
  MENSAJES_DECIMAL,
  restarDecimales,
  sumarDecimales,
} from "./decimal";

const dos = { maxDecimales: 2 };

describe("leerDecimal (W-04)", () => {
  it.each([
    ["3912,45", "3912.45"],
    ["3912.45", "3912.45"],
    ["  36,5 ", "36.5"],
    ["0,5", "0.5"],
    ["007", "7"],
    ["0", "0"],
    ["12345678901234567,89", "12345678901234567.89"],
  ])("%s → %s", (texto, esperado) => {
    expect(leerDecimal(texto, dos)).toEqual({ valor: esperado, error: null });
  });

  it.each(["", "abc", "3.912,45", "3,912.45", "1.234.567", "12,", ",5", "1 000", "1e3"])(
    "rechaza %j: un solo separador decimal y sin separador de miles",
    (texto) => {
      expect(leerDecimal(texto, dos)).toEqual({ valor: null, error: MENSAJES_DECIMAL.invalido });
    },
  );

  it("respeta el máximo de decimales", () => {
    expect(leerDecimal("1,234", dos).error).toBe("Admite máximo 2 decimales.");
    expect(leerDecimal("1,2", { maxDecimales: 1 })).toEqual({ valor: "1.2", error: null });
    expect(leerDecimal("1,25", { maxDecimales: 1 }).error).toBe("Admite máximo 1 decimal.");
    expect(leerDecimal("12,5", { maxDecimales: 0 }).error).toBe(MENSAJES_DECIMAL.entero);
  });

  it("rechaza negativos salvo que se permitan", () => {
    expect(leerDecimal("-2", dos).error).toBe(MENSAJES_DECIMAL.negativo);
    expect(leerDecimal("-2,5", { ...dos, permitirNegativo: true })).toEqual({ valor: "-2.5", error: null });
    expect(leerDecimal("-0", { ...dos, permitirNegativo: true }).valor).toBe("0");
  });
});

describe("decimalAEdicion", () => {
  it("convierte el texto de la API al formato para editar, sin ceros sobrantes", () => {
    expect(decimalAEdicion("19.5000")).toBe("19,5");
    expect(decimalAEdicion("25.0000")).toBe("25");
    expect(decimalAEdicion("3912.450000")).toBe("3912,45");
    expect(decimalAEdicion("12")).toBe("12");
    expect(decimalAEdicion(null)).toBe("");
    expect(decimalAEdicion(undefined)).toBe("");
  });
});

describe("aritmética decimal sin number", () => {
  it("suma y resta con distintas escalas y signos", () => {
    expect(sumarDecimales("10", "2")).toBe("12");
    expect(sumarDecimales("12.5", "0.25")).toBe("12.75");
    expect(sumarDecimales("0.1", "0.2")).toBe("0.3");
    expect(restarDecimales("10", "12.5")).toBe("-2.5");
    expect(restarDecimales("5.000", "5")).toBe("0");
    expect(sumarDecimales("-0.5", "0.5")).toBe("0");
    expect(sumarDecimales("12345678901234567.89", "0.11")).toBe("12345678901234568");
  });

  it("compara", () => {
    expect(compararDecimales("10", "9.99")).toBe(1);
    expect(compararDecimales("2.50", "2.5")).toBe(0);
    expect(compararDecimales("-1", "0")).toBe(-1);
  });
});
