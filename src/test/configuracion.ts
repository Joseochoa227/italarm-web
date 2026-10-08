import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";

import { pantalla } from "./pantalla";
import { servidor } from "./servidor";

beforeAll(() => {
  servidor.listen({ onUnhandledRequest: "error" });
});
afterEach(() => {
  cleanup();
  servidor.resetHandlers();
  servidor.events.removeAllListeners();
  localStorage.clear();
  pantalla.escritorio = true;
});
afterAll(() => {
  servidor.close();
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (consulta: string) => ({
    matches: consulta.includes("min-width: 820px") ? pantalla.escritorio : false,
    media: consulta,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

// Lo que jsdom no trae y Radix usa (menús y diálogos).
class ObservadorTamano {
  observe() {
    return undefined;
  }
  unobserve() {
    return undefined;
  }
  disconnect() {
    return undefined;
  }
}
const sinOperacion = () => undefined;
Object.assign(globalThis, { ResizeObserver: ObservadorTamano });
Object.assign(Element.prototype, {
  scrollIntoView: sinOperacion,
  hasPointerCapture: () => false,
  releasePointerCapture: sinOperacion,
});

// jsdom no desplaza la página: se ignora (la confirmación de un documento vuelve arriba).
window.scrollTo = () => undefined;
