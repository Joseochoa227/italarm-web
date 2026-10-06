import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProveedorAvisos } from "@/components/ui/Avisos";
import { useAvisar } from "@/components/ui/contextoAvisos";

import { ActualizacionPwa } from "./ActualizacionPwa";
import { AvisoSinConexion } from "./AvisoSinConexion";

const pwa = vi.hoisted(() => ({ hayVersionNueva: false, actualizar: vi.fn() }));

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [pwa.hayVersionNueva, () => undefined],
    offlineReady: [false, () => undefined],
    updateServiceWorker: pwa.actualizar,
  }),
}));

describe("Actualización de la app (BF-13)", () => {
  it("cuando hay una versión nueva ofrece actualizar", async () => {
    pwa.hayVersionNueva = true;
    render(
      <ProveedorAvisos>
        <ActualizacionPwa />
      </ProveedorAvisos>,
    );

    expect(await screen.findByText("Hay una versión nueva de ITALARM")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    expect(pwa.actualizar).toHaveBeenCalledWith(true);
  });

  it("sin versión nueva no muestra nada", () => {
    pwa.hayVersionNueva = false;
    render(
      <ProveedorAvisos>
        <ActualizacionPwa />
      </ProveedorAvisos>,
    );
    expect(screen.queryByText("Hay una versión nueva de ITALARM")).not.toBeInTheDocument();
  });
});

describe("Aviso sin conexión (BF-13)", () => {
  it("aparece al perder internet y desaparece al volver", () => {
    const enLinea = vi.spyOn(navigator, "onLine", "get");
    enLinea.mockReturnValue(true);
    render(<AvisoSinConexion />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    enLinea.mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Sin conexión a internet");

    enLinea.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    enLinea.mockRestore();
  });
});

describe("Avisos", () => {
  function Disparador() {
    const avisar = useAvisar();
    return (
      <button
        type="button"
        onClick={() => {
          avisar({ titulo: "No se pudo guardar", tono: "error" });
        }}
      >
        avisar
      </button>
    );
  }

  it("muestra el aviso y se puede cerrar", async () => {
    render(
      <ProveedorAvisos>
        <Disparador />
      </ProveedorAvisos>,
    );
    await userEvent.click(screen.getByRole("button", { name: "avisar" }));
    expect(await screen.findByText("No se pudo guardar")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cerrar notificación" }));
    expect(screen.queryByText("No se pudo guardar")).not.toBeInTheDocument();
  });

  it("useAvisar fuera del proveedor explica el error", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Disparador />)).toThrow("useAvisar debe usarse dentro de <ProveedorAvisos>");
  });
});
