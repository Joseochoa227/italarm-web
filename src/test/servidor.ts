import { HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createOpenApiHttp } from "openapi-msw";

import type { paths } from "@/api/esquema";

export const API = "http://api.prueba";

/** Simulador de la API tipado con el contrato (BF-19): las respuestas deben cumplir openapi.json. */
export const http = createOpenApiHttp<paths>({ baseUrl: API });

export const USUARIO_JOSE = { id: 1, nombre: "Jose Ochoa", correo: "jose@italarm.test" };

export const TOKEN = "token-de-prueba";

/** Cuerpo Problem Details como lo envía el backend (guía §2). */
export function problema(
  status: number,
  codigo: string,
  detail: string,
  extra: Record<string, unknown> = {},
): Response {
  return HttpResponse.json(
    { type: "about:blank", title: codigo, status, detail, codigo, correlationId: "corr-123", ...extra },
    { status, headers: { "Content-Type": "application/problem+json", "X-Correlation-Id": "corr-123" } },
  );
}

/** Respuestas por defecto: sesión válida para el token de prueba. */
export const manejadores = [
  http.get("/api/v1/sesion", ({ request, response }) => {
    if (request.headers.get("Authorization") !== `Bearer ${TOKEN}`) {
      return problema(401, "NO_AUTENTICADO", "Tu sesión terminó. Ingresa de nuevo.");
    }
    return response(200).json(USUARIO_JOSE);
  }),
  http.delete("/api/v1/sesion", ({ response }) => response(204).empty()),
];

export const servidor = setupServer(...manejadores);
