import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";

import { ErrorRuta } from "./ErrorRuta";

function PantallaRota(): never {
  throw new Error("falla al dibujar");
}

describe("ErrorRuta (BF-09)", () => {
  it("muestra el mensaje genérico y Reintentar recarga la página", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const recargar = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ reload: recargar } as unknown as Location);
    const router = createMemoryRouter([
      { path: "/", element: <PantallaRota />, errorElement: <ErrorRuta /> },
    ]);

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/Algo salió mal/);
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(recargar).toHaveBeenCalled();
  });
});
