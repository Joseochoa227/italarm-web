import { HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";

import { guardarToken, leerToken } from "@/api/token";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor, TOKEN, USUARIO_JOSE } from "@/test/servidor";

describe("Sesión al cargar la app (guía §1)", () => {
  it("con un token válido entra directo, después de mostrar el esqueleto", async () => {
    let responder: () => void = () => undefined;
    servidor.use(
      http.get("/api/v1/sesion", async ({ response }) => {
        await new Promise<void>((r) => (responder = r));
        return response(200).json(USUARIO_JOSE);
      }),
    );
    renderizarApp();

    expect(await screen.findByRole("status")).toHaveTextContent("Cargando tu sesión…");
    responder();
    expect(await screen.findByRole("heading", { name: "Hola, Jose" })).toBeInTheDocument();
  });

  it("con un token inválido (401) lo borra y muestra el ingreso", async () => {
    guardarToken("token-viejo");
    const { router } = renderizarApp({ conToken: false });

    expect(await screen.findByRole("button", { name: "Ingresar" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/ingresar");
    expect(leerToken()).toBeNull();
  });

  it("sin token no llama a la API y muestra el ingreso", async () => {
    let llamadas = 0;
    servidor.use(
      http.get("/api/v1/sesion", ({ response }) => {
        llamadas++;
        return response(200).json(USUARIO_JOSE);
      }),
    );
    renderizarApp({ conToken: false });

    expect(await screen.findByRole("button", { name: "Ingresar" })).toBeInTheDocument();
    expect(llamadas).toBe(0);
  });

  it("si el servidor no responde, muestra el error con Reintentar y conserva el token", async () => {
    let fallar = true;
    servidor.use(
      http.get("/api/v1/sesion", ({ response }) => {
        if (fallar) return problema(500, "ERROR_INTERNO", "Error interno.");
        return response(200).json(USUARIO_JOSE);
      }),
    );
    const { usuario } = renderizarApp();

    const alerta = await screen.findByRole("alert", {}, { timeout: 4000 });
    expect(alerta).toHaveTextContent(/Algo salió mal/);
    expect(alerta).toHaveTextContent("Código de soporte: corr-123");
    expect(leerToken()).toBe(TOKEN);

    fallar = false;
    await usuario.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { name: "Hola, Jose" })).toBeInTheDocument();
  });
});

describe("Cerrar sesión", () => {
  async function cerrarSesion(usuario: ReturnType<typeof renderizarApp>["usuario"]) {
    await usuario.click(await screen.findByRole("button", { name: "Menú de tu cuenta" }));
    await usuario.click(await screen.findByRole("menuitem", { name: "Cerrar sesión" }));
  }

  it("llama a DELETE /sesion, borra el token y vuelve al ingreso", async () => {
    let autorizacion: string | null = null;
    servidor.use(
      http.delete("/api/v1/sesion", ({ request, response }) => {
        autorizacion = request.headers.get("Authorization");
        return response(204).empty();
      }),
    );
    const { usuario, router } = renderizarApp();

    await cerrarSesion(usuario);

    expect(await screen.findByRole("button", { name: "Ingresar" })).toBeInTheDocument();
    expect(autorizacion).toBe(`Bearer ${TOKEN}`);
    expect(leerToken()).toBeNull();
    expect(router.state.location.pathname).toBe("/ingresar");
  });

  it("aunque la petición falle, el navegador queda sin sesión", async () => {
    servidor.use(http.delete("/api/v1/sesion", () => HttpResponse.error()));
    const { usuario } = renderizarApp();

    await cerrarSesion(usuario);

    expect(await screen.findByRole("button", { name: "Ingresar" })).toBeInTheDocument();
    expect(leerToken()).toBeNull();
  });
});

describe("401 en cualquier petición", () => {
  it("cierra la sesión y vuelve al ingreso conservando la ruta", async () => {
    servidor.use(
      http.put("/api/v1/usuarios/actual/contrasena", () =>
        problema(401, "NO_AUTENTICADO", "Tu sesión terminó. Ingresa de nuevo."),
      ),
    );
    const { usuario, router } = renderizarApp({ ruta: "/cuenta/contrasena" });

    await usuario.type(await screen.findByLabelText("Contraseña actual"), "Italarm#2025");
    await usuario.type(screen.getByLabelText("Contraseña nueva"), "Italarm#2026");
    await usuario.type(screen.getByLabelText("Repite la contraseña nueva"), "Italarm#2026");
    await usuario.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/ingresar");
    });
    expect(router.state.location.search).toBe("?volver=%2Fcuenta%2Fcontrasena");
    expect(leerToken()).toBeNull();
  });
});
