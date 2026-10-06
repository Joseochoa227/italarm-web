import { render, screen } from "@testing-library/react";

import { ErrorConfiguracion } from "./ErrorConfiguracion";

it("muestra en pantalla qué falta configurar", () => {
  render(<ErrorConfiguracion mensaje="Configuración incompleta: VITE_API_URL debe ser una URL." />);
  expect(screen.getByRole("alert")).toHaveTextContent("Configuración incompleta: VITE_API_URL");
});
