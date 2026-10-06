import { revisarEntorno } from "./entorno";

describe("revisarEntorno", () => {
  it("acepta la URL de la API y le quita la barra final", () => {
    expect(revisarEntorno({ VITE_API_URL: "http://localhost:8080/" })).toEqual({
      entorno: { VITE_API_URL: "http://localhost:8080" },
      error: null,
    });
  });

  it("explica qué falta cuando VITE_API_URL no está o no es una URL, sin lanzar", () => {
    expect(revisarEntorno({}).error).toMatch(/Configuración incompleta: VITE_API_URL/);
    expect(revisarEntorno({ VITE_API_URL: "localhost" }).error).toMatch(/\.env\.example/);
  });
});
