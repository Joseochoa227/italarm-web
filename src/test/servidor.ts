import { HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createOpenApiHttp } from "openapi-msw";

import type { paths } from "@/api/esquema";

import { CATEGORIAS, configuracion, tasasVigentes, UNIDADES, USUARIOS } from "./datos";

export const API = "http://api.prueba";

/** Simulador de la API tipado con el contrato (BF-19): las respuestas deben cumplir openapi.json. */
export const http = createOpenApiHttp<paths>({ baseUrl: API });

export const USUARIO_JOSE = { id: 1, nombre: "Jose Ochoa", correo: "jose@italarm.test" };

export const TOKEN = "token-de-prueba";

/**
 * Cuerpo Problem Details como lo envía el backend (guía §2). Se tipa como HttpResponse<never> para
 * poder usarlo en cualquier ruta: muchas no declaran sus respuestas de error en el contrato.
 */
export function problema(
  status: number,
  codigo: string,
  detail: string,
  extra: Record<string, unknown> = {},
): HttpResponse<never> {
  return HttpResponse.json(
    { type: "about:blank", title: codigo, status, detail, codigo, correlationId: "corr-123", ...extra },
    { status, headers: { "Content-Type": "application/problem+json", "X-Correlation-Id": "corr-123" } },
  ) as unknown as HttpResponse<never>;
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
  http.get("/api/v1/tasas/vigentes", ({ response }) => response(200).json(tasasVigentes())),
  http.get("/api/v1/configuracion", ({ response }) => response(200).json(configuracion())),
  http.get("/api/v1/categorias", ({ response }) => response(200).json(CATEGORIAS)),
  http.get("/api/v1/unidades-medida", ({ response }) => response(200).json(UNIDADES)),
  http.get("/api/v1/usuarios", ({ response }) => response(200).json(USUARIOS)),
];

export const servidor = setupServer(...manejadores);
