import type { Page, Route } from "@playwright/test";

export const API = "http://localhost:8080/api/v1";
export const USUARIO = { id: 1, nombre: "Jose Ochoa", correo: "jose@italarm.test" };
const CONTRASENA_INICIAL = "Italarm#2026";

function problema(route: Route, status: number, codigo: string, detail: string) {
  return route.fulfill({
    status,
    contentType: "application/problem+json",
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ type: "about:blank", status, codigo, detail, correlationId: "e2e" }),
  });
}

function json(route: Route, status: number, cuerpo?: unknown) {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers: { "Access-Control-Allow-Origin": "*" },
    ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
  });
}

/**
 * Backend simulado con estado: un usuario, sus tokens y su contraseña. Responde como el contrato
 * de la Fase 0 (sesión y cambio de contraseña).
 */
export async function simularApi(page: Page) {
  const estado = { contrasena: CONTRASENA_INICIAL, tokens: new Set<string>(), siguiente: 1 };

  await page.route(`${API}/**`, async (route) => {
    const peticion = route.request();
    const ruta = new URL(peticion.url()).pathname.replace("/api/v1", "");
    const metodo = peticion.method();
    if (metodo === "OPTIONS") {
      return route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
          "Access-Control-Allow-Headers": "Authorization,Content-Type",
        },
      });
    }
    const token = (await peticion.headerValue("authorization"))?.replace("Bearer ", "") ?? "";
    const autenticado = estado.tokens.has(token);

    if (ruta === "/sesion" && metodo === "POST") {
      const { correo, contrasena } = peticion.postDataJSON() as { correo: string; contrasena: string };
      if (correo !== USUARIO.correo || contrasena !== estado.contrasena) {
        return problema(route, 401, "CREDENCIALES_INVALIDAS", "El correo o la contraseña no son correctos.");
      }
      const nuevo = `token-${estado.siguiente++}`;
      estado.tokens.add(nuevo);
      return json(route, 200, { token: nuevo, usuario: USUARIO });
    }
    if (!autenticado) return problema(route, 401, "NO_AUTENTICADO", "Tu sesión terminó. Ingresa de nuevo.");
    if (ruta === "/sesion" && metodo === "GET") return json(route, 200, USUARIO);
    if (ruta === "/sesion" && metodo === "DELETE") {
      estado.tokens.delete(token);
      return json(route, 204);
    }
    if (ruta === "/usuarios/actual/contrasena" && metodo === "PUT") {
      const cuerpo = peticion.postDataJSON() as { contrasenaActual: string; contrasenaNueva: string };
      if (cuerpo.contrasenaActual !== estado.contrasena) {
        return problema(route, 409, "CONTRASENA_ACTUAL_INCORRECTA", "La contraseña actual no es correcta.");
      }
      estado.contrasena = cuerpo.contrasenaNueva;
      // Conserva esta sesión y cierra las demás.
      estado.tokens = new Set([token]);
      return json(route, 204);
    }
    return problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
  });

  return { CONTRASENA_INICIAL };
}
