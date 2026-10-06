import { screen, within } from "@testing-library/react";

import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

describe("Usuarios (RF-148, P-15)", () => {
  it("lista los usuarios; para uno mismo no hay desactivar ni restablecer", async () => {
    renderizarApp({ ruta: "/usuarios" });

    const lista = await screen.findByRole("list", { name: "Usuarios" });
    const [jose, victor, ayudante] = within(lista).getAllByRole("listitem");
    expect(jose).toHaveTextContent("Jose Ochoa Tú");
    expect(within(jose!).queryByRole("button")).not.toBeInTheDocument();
    expect(within(victor!).getByRole("button", { name: "Desactivar" })).toBeVisible();
    expect(ayudante).toHaveTextContent("Inactivo");
    expect(within(ayudante!).getByRole("button", { name: "Activar" })).toBeVisible();
  });

  it("crea un usuario validando la política de contraseñas", async () => {
    let cuerpo: unknown;
    servidor.use(
      http.post("/api/v1/usuarios", async ({ request, response }) => {
        cuerpo = await request.json();
        return response(201).json({
          id: 4,
          nombre: "Ana",
          correo: "ana@italarm.test",
          activo: true,
          version: 0,
        });
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/usuarios" });

    await usuario.click(await screen.findByRole("button", { name: "Nuevo usuario" }));
    const dialogo = await screen.findByRole("dialog", { name: "Nuevo usuario" });
    await usuario.type(within(dialogo).getByLabelText("Nombre"), "Ana");
    await usuario.type(within(dialogo).getByLabelText("Correo"), "ana@italarm.test");
    await usuario.type(within(dialogo).getByLabelText("Contraseña inicial"), "debil");
    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar" }));
    expect(await within(dialogo).findByText("Debe tener al menos 8 caracteres.")).toBeVisible();

    await usuario.clear(within(dialogo).getByLabelText("Contraseña inicial"));
    await usuario.type(within(dialogo).getByLabelText("Contraseña inicial"), "Inicial#2026");
    await usuario.type(within(dialogo).getByLabelText("Repite la contraseña"), "Inicial#2026");
    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Usuario creado")).toBeVisible();
    expect(cuerpo).toEqual({
      nombre: "Ana",
      correo: "ana@italarm.test",
      contrasena: "Inicial#2026",
      confirmacion: "Inicial#2026",
    });
  });

  it("muestra el correo duplicado en su campo", async () => {
    servidor.use(
      http.post("/api/v1/usuarios", () =>
        problema(409, "USUARIO_CORREO_DUPLICADO", "Ya existe un usuario con ese correo."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/usuarios" });
    await usuario.click(await screen.findByRole("button", { name: "Nuevo usuario" }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.type(within(dialogo).getByLabelText("Nombre"), "Otro Jose");
    await usuario.type(within(dialogo).getByLabelText("Correo"), "jose@italarm.test");
    await usuario.type(within(dialogo).getByLabelText("Contraseña inicial"), "Inicial#2026");
    await usuario.type(within(dialogo).getByLabelText("Repite la contraseña"), "Inicial#2026");
    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar" }));

    expect(await within(dialogo).findByText("Ya existe un usuario con ese correo.")).toBeVisible();
    expect(within(dialogo).getByLabelText("Correo")).toHaveAttribute("aria-invalid", "true");
  });

  it("desactiva con confirmación y activa", async () => {
    const llamadas: string[] = [];
    servidor.use(
      http.post("/api/v1/usuarios/{id}/desactivar", ({ params, response }) => {
        llamadas.push(`desactivar ${params.id}`);
        return response(200).json({ id: 2, nombre: "Victor", activo: false });
      }),
      http.post("/api/v1/usuarios/{id}/activar", ({ params, response }) => {
        llamadas.push(`activar ${params.id}`);
        return response(200).json({ id: 3, nombre: "Ayudante", activo: true });
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/usuarios" });

    await usuario.click(await screen.findByRole("button", { name: "Desactivar" }));
    const dialogo = await screen.findByRole("dialog", { name: "¿Desactivar a Victor?" });
    expect(dialogo).toHaveTextContent("se cerrarán todas sus sesiones");
    await usuario.click(within(dialogo).getByRole("button", { name: "Desactivar" }));
    expect(await screen.findByText("Usuario desactivado")).toBeVisible();

    await usuario.click(screen.getByRole("button", { name: "Activar" }));
    expect(await screen.findByText("Usuario activado")).toBeVisible();
    expect(llamadas).toEqual(["desactivar 2", "activar 3"]);
  });

  it("restablece la contraseña de otro usuario", async () => {
    let cuerpo: unknown;
    servidor.use(
      http.post("/api/v1/usuarios/{id}/restablecer-contrasena", async ({ request, response }) => {
        cuerpo = await request.json();
        return response(200).json({ id: 2, nombre: "Victor", activo: true });
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/usuarios" });
    const victor = within(await screen.findByRole("list", { name: "Usuarios" })).getAllByRole("listitem")[1]!;
    await usuario.click(within(victor).getByRole("button", { name: "Restablecer contraseña" }));
    const dialogo = await screen.findByRole("dialog", { name: "Restablecer la contraseña de Victor" });
    await usuario.type(within(dialogo).getByLabelText("Contraseña nueva"), "Nueva.Clave9");
    await usuario.type(within(dialogo).getByLabelText("Repite la contraseña"), "Nueva.Clave8");
    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar" }));
    expect(await within(dialogo).findByText("Las contraseñas no coinciden.")).toBeVisible();

    await usuario.clear(within(dialogo).getByLabelText("Repite la contraseña"));
    await usuario.type(within(dialogo).getByLabelText("Repite la contraseña"), "Nueva.Clave9");
    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Contraseña restablecida")).toBeVisible();
    expect(cuerpo).toEqual({ contrasenaNueva: "Nueva.Clave9", confirmacion: "Nueva.Clave9" });
  });
});
