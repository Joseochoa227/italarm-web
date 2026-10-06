import { rutaIngreso, rutaVolver } from "./rutaVolver";

describe("rutaVolver", () => {
  it("acepta rutas internas", () => {
    expect(rutaVolver("/compras?mes=10")).toBe("/compras?mes=10");
  });

  it.each([null, "", "https://otro.com", "//otro.com", "/\\otro.com", "compras", "/ingresar?volver=/x"])(
    "lleva a Inicio cualquier otra cosa: %s",
    (valor) => {
      expect(rutaVolver(valor)).toBe("/");
    },
  );
});

describe("rutaIngreso", () => {
  it("conserva la ruta, salvo Inicio", () => {
    expect(rutaIngreso("/")).toBe("/ingresar");
    expect(rutaIngreso("/compras?mes=10")).toBe("/ingresar?volver=%2Fcompras%3Fmes%3D10");
  });
});
