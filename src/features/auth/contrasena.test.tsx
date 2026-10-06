import { screen, within } from "@testing-library/react";

import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

async function abrirCambio() {
  const app = renderizarApp({ ruta: "/cuenta/contrasena" });
  await screen.findByRole("heading", { name: "Cambiar contraseña" });
  return app;
}

async function llenar(
  usuario: ReturnType<typeof renderizarApp>["usuario"],
  actual: string,
  nueva: string,
  confirmacion = nueva,
) {
  if (actual) await usuario.type(screen.getByLabelText("Contraseña actual"), actual);
  if (nueva) await usuario.type(screen.getByLabelText("Contraseña nueva"), nueva);
  if (confirmacion) await usuario.type(screen.getByLabelText("Repite la contraseña nueva"), confirmacion);
  await usuario.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
}

describe("Cambiar contraseña (RU-07)", () => {
  it("envía la actual, la nueva y la confirmación, y avisa que se cerraron las otras sesiones", async () => {
    let cuerpo: unknown;
    servidor.use(
      http.put("/api/v1/usuarios/actual/contrasena", async ({ request, response }) => {
        cuerpo = await request.json();
        return response(204).empty();
      }),
    );
    const { usuario, router } = await abrirCambio();

    await llenar(usuario, "Italarm#2025", "Nueva.Clave9");

    const aviso = await screen.findByText("Contraseña cambiada");
    expect(within(aviso.closest("li")!).getByText("Se cerraron tus otras sesiones.")).toBeInTheDocument();
    expect(cuerpo).toEqual({
      contrasenaActual: "Italarm#2025",
      contrasenaNueva: "Nueva.Clave9",
      confirmacion: "Nueva.Clave9",
    });
    expect(router.state.location.pathname).toBe("/");
  });

  it.each([
    ["Cort#1a", "", "Debe tener al menos 8 caracteres."],
    ["italarm#2026", "", "Debe tener al menos una mayúscula."],
    ["ITALARM#2026", "", "Debe tener al menos una minúscula."],
    ["Italarm#abc", "", "Debe tener al menos un número."],
    ["Italarm 2026", "", "Debe tener al menos un signo, por ejemplo ! # $ % * ."],
    [`Aa1#${"x".repeat(61)}`, "", "Debe tener máximo 64 caracteres."],
    ["Italarm#2026", "Italarm#2027", "Las contraseñas no coinciden."],
  ])("valida la política de contraseñas (P-07, P-08): %s", async (nueva, confirmacion, mensaje) => {
    const { usuario } = await abrirCambio();

    await llenar(usuario, "Actual#2025", nueva, confirmacion || nueva);

    expect(await screen.findByText(mensaje)).toBeInTheDocument();
  });

  it("acepta letras con tilde y la ñ como mayúsculas y minúsculas, igual que el backend", async () => {
    servidor.use(http.put("/api/v1/usuarios/actual/contrasena", ({ response }) => response(204).empty()));
    const { usuario } = await abrirCambio();

    await llenar(usuario, "Actual#2025", "Ñandú-2026");

    expect(await screen.findByText("Contraseña cambiada")).toBeInTheDocument();
  });

  it("no permite que la nueva sea igual a la actual", async () => {
    const { usuario } = await abrirCambio();

    await llenar(usuario, "Italarm#2026", "Italarm#2026");

    expect(
      await screen.findByText("La contraseña nueva debe ser distinta de la actual."),
    ).toBeInTheDocument();
  });

  it("muestra CONTRASENA_ACTUAL_INCORRECTA en el campo de la contraseña actual", async () => {
    servidor.use(
      http.put("/api/v1/usuarios/actual/contrasena", () =>
        problema(409, "CONTRASENA_ACTUAL_INCORRECTA", "La contraseña actual no es correcta."),
      ),
    );
    const { usuario } = await abrirCambio();

    await llenar(usuario, "Equivocada#1", "Nueva.Clave9");

    expect(await screen.findByText("La contraseña actual no es correcta.")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña actual")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("muestra CONTRASENA_DEBIL del backend en el campo de la nueva", async () => {
    servidor.use(
      http.put("/api/v1/usuarios/actual/contrasena", () =>
        problema(400, "CONTRASENA_DEBIL", "La contraseña debe tener al menos 8 caracteres. Falta: un signo."),
      ),
    );
    const { usuario } = await abrirCambio();

    await llenar(usuario, "Actual#2025", "Nueva.Clave9");

    expect(await screen.findByText(/Falta: un signo/)).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña nueva")).toHaveAttribute("aria-invalid", "true");
  });

  it("ante un error interno muestra el mensaje general con el código de soporte", async () => {
    servidor.use(
      http.put("/api/v1/usuarios/actual/contrasena", () => problema(500, "ERROR_INTERNO", "Error interno.")),
    );
    const { usuario } = await abrirCambio();

    await llenar(usuario, "Actual#2025", "Nueva.Clave9");

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent(/Algo salió mal/);
    expect(alerta).toHaveTextContent("corr-123");
  });

  it("permite ver la contraseña escrita", async () => {
    const { usuario } = await abrirCambio();
    const campo = screen.getByLabelText("Contraseña actual");
    expect(campo).toHaveAttribute("type", "password");

    await usuario.click(screen.getAllByRole("button", { name: "Mostrar contraseña" })[0]!);

    expect(campo).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar contraseña" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
