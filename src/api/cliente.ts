import createFetchClient, { type Middleware } from "openapi-fetch";
import createQueryClient from "openapi-react-query";

import { leerEntorno } from "@/lib/entorno";

import type { paths } from "./esquema";
import { ErrorApi, leerProblema, SIN_CONEXION } from "./problema";
import { leerToken } from "./token";

type AlNoAutenticado = () => void;

let alNoAutenticado: AlNoAutenticado = () => undefined;

/** La app registra aquí qué hacer cuando la sesión deja de ser válida (cualquier 401). */
export function registrarAlNoAutenticado(funcion: AlNoAutenticado): () => void {
  alNoAutenticado = funcion;
  return () => {
    if (alNoAutenticado === funcion) alNoAutenticado = () => undefined;
  };
}

const RUTA_INGRESO = "/api/v1/sesion";

/**
 * 1. Agrega el token Bearer a toda petición (guía §1).
 * 2. Convierte toda respuesta de error en ErrorApi, para que las consultas y mutaciones fallen con
 *    un error tipado por su `codigo`.
 * 3. Un 401 fuera del ingreso significa que la sesión se cerró: avisa a la app.
 */
const middleware: Middleware = {
  onRequest({ request }) {
    const token = leerToken();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },
  async onResponse({ request, response, schemaPath }) {
    if (response.ok) return response;
    const error = await leerProblema(response);
    const esIngreso = schemaPath === RUTA_INGRESO && request.method === "POST";
    if (response.status === 401 && !esIngreso) alNoAutenticado();
    throw error;
  },
  onError({ error }) {
    if (error instanceof ErrorApi) return error;
    // fetch rechaza la promesa sin respuesta: red caída, CORS o servidor apagado.
    return new ErrorApi(0, SIN_CONEXION, null);
  },
};

export function crearClienteApi(baseUrl: string) {
  const cliente = createFetchClient<paths>({
    baseUrl,
    // Se resuelve fetch en cada llamada (no al crear el cliente) para que MSW lo pueda interceptar.
    fetch: (peticion) => globalThis.fetch(peticion),
  });
  cliente.use(middleware);
  return cliente;
}

export const api = crearClienteApi(leerEntorno(import.meta.env).VITE_API_URL);

/** Hooks de TanStack Query tipados por ruta: $api.useQuery("get", "/api/v1/...") (BF-03, BF-04). */
export const $api = createQueryClient(api);
