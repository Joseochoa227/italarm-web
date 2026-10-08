import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { ProveedorAvisos } from "@/components/ui/Avisos";

import { CampoSeriales } from "./CampoSeriales";

const camara = vi.hoisted(() => ({ falla: false, leer: "" }));

vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatReader: class {
    decodeFromVideoDevice(
      _dispositivo: unknown,
      _video: unknown,
      alLeer: (r: { getText: () => string } | undefined, e: unknown, c: { stop: () => void }) => void,
    ) {
      if (camara.falla) return Promise.reject(new Error("Permission denied"));
      setTimeout(() => {
        alLeer({ getText: () => camara.leer }, undefined, { stop: () => undefined });
      }, 0);
      return Promise.resolve({ stop: () => undefined });
    }
  },
}));

function Prueba({ cantidad }: { cantidad: number }) {
  const [valores, setValores] = useState<string[]>(Array.from({ length: cantidad }, () => ""));
  return (
    <ProveedorAvisos>
      <CampoSeriales producto="Cámara domo" valores={valores} alCambiar={setValores} />
      <output aria-label="valores">{valores.join("|")}</output>
    </ProveedorAvisos>
  );
}

describe("CampoSeriales (RF-20, P-22)", () => {
  it("una casilla por unidad, en mayúsculas y sin espacios al salir", async () => {
    const usuario = userEvent.setup();
    render(<Prueba cantidad={3} />);

    expect(screen.getAllByRole("textbox")).toHaveLength(3);
    expect(screen.getByText("Seriales · 0 de 3")).toBeVisible();
    await usuario.type(screen.getByLabelText("Serial 1 de Cámara domo"), "  abc-1 ");
    await usuario.tab();

    expect(screen.getByLabelText("valores")).toHaveTextContent("ABC-1||");
    expect(screen.getByText("Seriales · 1 de 3")).toBeVisible();
  });

  it("marca los repetidos y dice Completos cuando están todos", async () => {
    const usuario = userEvent.setup();
    render(<Prueba cantidad={2} />);

    await usuario.type(screen.getByLabelText("Serial 1 de Cámara domo"), "A1");
    await usuario.type(screen.getByLabelText("Serial 2 de Cámara domo"), "a1");
    await usuario.tab();
    // Se marcan las dos casillas que repiten el serial.
    expect(screen.getAllByText("Repetido", { selector: "span" })).toHaveLength(2);
    expect(screen.getAllByRole("textbox")[1]).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("Completos")).not.toBeInTheDocument();

    await usuario.clear(screen.getByLabelText("Serial 2 de Cámara domo"));
    await usuario.type(screen.getByLabelText("Serial 2 de Cámara domo"), "a2");
    expect(screen.getByText("Completos")).toBeVisible();
  });

  it("con la cámara llena la primera casilla vacía (BF-14)", async () => {
    camara.falla = false;
    camara.leer = "sn-555";
    const usuario = userEvent.setup();
    render(<Prueba cantidad={2} />);

    await usuario.click(screen.getByRole("button", { name: "Escanear" }));
    expect(await screen.findByLabelText("valores")).toHaveTextContent("SN-555|");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sin permiso de cámara lo explica y se puede seguir escribiendo", async () => {
    camara.falla = true;
    const usuario = userEvent.setup();
    render(<Prueba cantidad={1} />);

    await usuario.click(screen.getByRole("button", { name: "Escanear" }));
    expect(await screen.findByText(/No se pudo usar la cámara/)).toBeVisible();
    await usuario.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
