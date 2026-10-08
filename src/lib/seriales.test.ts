import { ajustarSeriales, normalizarSerial, serialesRepetidos, unidadesDe } from "./seriales";

describe("seriales (P-22)", () => {
  it("normaliza sin espacios a los lados y en mayúsculas", () => {
    expect(normalizarSerial("  abc-123 ")).toBe("ABC-123");
  });

  it("encuentra repetidos sin importar mayúsculas ni espacios", () => {
    expect([...serialesRepetidos(["abc", "ABC ", "x", "", ""])]).toEqual(["ABC"]);
  });

  it("ajusta la lista a la cantidad conservando lo escrito", () => {
    expect(ajustarSeriales(["A", "B", "C"], 2)).toEqual(["A", "B"]);
    expect(ajustarSeriales(["A"], 3)).toEqual(["A", "", ""]);
  });

  it("solo pide seriales para cantidades enteras", () => {
    expect(unidadesDe("3")).toBe(3);
    expect(unidadesDe("2.5")).toBe(0);
    expect(unidadesDe("")).toBe(0);
    expect(unidadesDe(undefined)).toBe(0);
    expect(unidadesDe("5000")).toBe(1000);
  });
});
