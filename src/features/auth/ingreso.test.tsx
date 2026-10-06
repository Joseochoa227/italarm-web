import { HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";

import { leerToken } from "@/api/token";
import { problema, http, servidor, TOKEN, USUARIO_JOSE } from "@/test/servidor";
import { renderizarApp } from "@/test/renderizar";

async function llenarIngreso(
  usuario: ReturnType<typeof renderizarApp>["usuario"],
  correo: string,
  clave: string,
) {
  await usuario.type(await screen.findByLabelText("Correo"), correo);
  await usuario.type(screen.getByLabelText("Contraseña"), clave);
  await usuario.click(screen.getByRole("button", { name: "Ingresar" }));
}

describe("Ingreso (Fase 0)", () => {
  it("con credenciales correctas guarda el token y muestra el menú con el usuario", async () => {
    let cuerpoRecibido: unknown;
    servidor.use(
      http.post("/api/v1/sesion", async ({ request, response }) => {
        cuerpoRecibido = await request.json();
        return response(200).json({ token: TOKEN, usuario: USUARIO_JOSE });
      }),
    );
    const { usuario, router } = renderizarApp({ ruta: "/ingresar", conToken: false });

    await llenarIngreso(usuario, "jose@italarm.test", "Italarm#2026");

    expect(await screen.findByRole("heading", { name: "Hola, Jose" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Menú principal" })).toBeInTheDocument();
    expect(screen.getByText("Jose Ochoa")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    expect(leerToken()).toBe(TOKEN);
    expect(cuerpoRecibido).toEqual({ correo: "jose@italarm.test", contrasena: "Italarm#2026" });
  });

  it("con credenciales incorrectas muestra el mensaje del backend y no guarda token", async () => {
    servidor.use(
      http.post("/api/v1/sesion", () =>
        problema(401, "CREDENCIALES_INVALIDAS", "El correo o la contraseña no son correctos."),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/ingresar", conToken: false });

    await llenarIngreso(usuario, "jose@italarm.test", "equivocada");

    expect(await screen.findByRole("alert")).toHaveTextContent("El correo o la contraseña no son correctos.");
    expect(leerToken()).toBeNull();
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeEnabled();
  });

  it("deshabilita el botón mientras se ingresa (BF-10)", async () => {
    let responder: () => void = () => undefined;
    servidor.use(
      http.post("/api/v1/sesion", async ({ response }) => {
        await new Promise<void>((r) => (responder = r));
        return response(200).json({ token: TOKEN, usuario: USUARIO_JOSE });
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/ingresar", conToken: false });

    await llenarIngreso(usuario, "jose@italarm.test", "Italarm#2026");

    const boton = screen.getByRole("button", { name: "Ingresar" });
    await waitFor(() => {
      expect(boton).toBeDisabled();
    });
    expect(boton).toHaveAttribute("aria-busy", "true");
    responder();
    expect(await screen.findByRole("heading", { name: "Hola, Jose" })).toBeInTheDocument();
  });

  it("valida el formulario junto a cada campo sin llamar a la API", async () => {
    const { usuario } = renderizarApp({ ruta: "/ingresar", conToken: false });

    await usuario.click(await screen.findByRole("button", { name: "Ingresar" }));
    expect(await screen.findByText("Escribe tu correo.")).toBeInTheDocument();
    expect(screen.getByText("Escribe tu contraseña.")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toHaveAttribute("aria-invalid", "true");

    await usuario.type(screen.getByLabelText("Correo"), "jose");
    await usuario.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(await screen.findByText(/Escribe un correo válido/)).toBeInTheDocument();
  });

  it("muestra los errores de VALIDACION del backend junto al campo", async () => {
    servidor.use(
      http.post("/api/v1/sesion", () =>
        problema(400, "VALIDACION", "Revisa los datos ingresados.", {
          errores: [{ campo: "correo", mensaje: "El correo no es válido." }],
        }),
      ),
    );
    const { usuario } = renderizarApp({ ruta: "/ingresar", conToken: false });

    await llenarIngreso(usuario, "jose@italarm.test", "x");

    expect(await screen.findByText("El correo no es válido.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("sin conexión con el servidor muestra un mensaje claro", async () => {
    servidor.use(http.post("/api/v1/sesion", () => HttpResponse.error()));
    const { usuario } = renderizarApp({ ruta: "/ingresar", conToken: false });

    await llenarIngreso(usuario, "jose@italarm.test", "Italarm#2026");

    expect(await screen.findByRole("alert")).toHaveTextContent(/No hay conexión con el servidor/);
  });

  it("después de ingresar vuelve a la ruta que se pidió", async () => {
    servidor.use(
      http.post("/api/v1/sesion", ({ response }) =>
        response(200).json({ token: TOKEN, usuario: USUARIO_JOSE }),
      ),
    );
    const { usuario, router } = renderizarApp({ ruta: "/compras?mes=10", conToken: false });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/ingresar");
    });
    expect(router.state.location.search).toBe("?volver=%2Fcompras%3Fmes%3D10");

    await llenarIngreso(usuario, "jose@italarm.test", "Italarm#2026");

    expect(await screen.findByRole("heading", { name: "Compras" })).toBeInTheDocument();
    expect(router.state.location.search).toBe("?mes=10");
  });

  it("con sesión iniciada, la pantalla de ingreso lleva a Inicio", async () => {
    const { router } = renderizarApp({ ruta: "/ingresar" });

    expect(await screen.findByRole("heading", { name: "Hola, Jose" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });
});
