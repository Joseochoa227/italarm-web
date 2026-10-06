import { leerEntorno } from "./entorno";

describe("leerEntorno", () => {
  it("acepta la URL de la API y le quita la barra final", () => {
    expect(leerEntorno({ VITE_API_URL: "http://localhost:8080/" })).toEqual({
      VITE_API_URL: "http://localhost:8080",
    });
  });

  it("explica qué falta cuando VITE_API_URL no está o no es una URL", () => {
    expect(() => leerEntorno({})).toThrow(/Configuración incompleta: VITE_API_URL/);
    expect(() => leerEntorno({ VITE_API_URL: "localhost" })).toThrow(/\.env\.example/);
  });
});
