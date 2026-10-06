import { ErrorApi, RESPUESTA_INVALIDA, SIN_CONEXION } from "@/api/problema";

import {
  aplicarErroresDeCampo,
  erroresDeCampo,
  esReintentable,
  MENSAJES_ERROR,
  mensajeDeError,
} from "./errores";

describe("mensajeDeError (decide por el código, guía §2)", () => {
  it("errores de negocio: el detail del backend", () => {
    expect(mensajeDeError(new ErrorApi(422, "STOCK_INSUFICIENTE", "Stock insuficiente · quedan 3 und"))).toBe(
      "Stock insuficiente · quedan 3 und",
    );
  });

  it("sin conexión: mensaje propio", () => {
    expect(mensajeDeError(new ErrorApi(0, SIN_CONEXION, null))).toBe(MENSAJES_ERROR.sinConexion);
    expect(mensajeDeError(new TypeError("Failed to fetch"))).toBe(MENSAJES_ERROR.sinConexion);
  });

  it("errores internos o respuestas inválidas: mensaje genérico, aunque traigan detail", () => {
    expect(mensajeDeError(new ErrorApi(500, "ERROR_INTERNO", "NullPointerException"))).toBe(
      MENSAJES_ERROR.generico,
    );
    expect(mensajeDeError(new ErrorApi(502, RESPUESTA_INVALIDA, null))).toBe(MENSAJES_ERROR.generico);
    expect(mensajeDeError(new ErrorApi(400, "VALIDACION", null))).toBe(MENSAJES_ERROR.generico);
  });
});

describe("esReintentable", () => {
  it("solo sin respuesta, con falla del servidor o respuesta inválida", () => {
    expect(esReintentable(new ErrorApi(0, SIN_CONEXION, null))).toBe(true);
    expect(esReintentable(new ErrorApi(503, "ERROR_INTERNO", null))).toBe(true);
    expect(esReintentable(new ErrorApi(400, RESPUESTA_INVALIDA, null))).toBe(true);
    expect(esReintentable(new ErrorApi(409, "MODIFICADO_POR_OTRO_USUARIO", "x"))).toBe(false);
    expect(esReintentable(new ErrorApi(401, "NO_AUTENTICADO", "x"))).toBe(false);
  });
});

describe("erroresDeCampo y aplicarErroresDeCampo (BF-05)", () => {
  const campos = ["nombre", "precio"] as const;

  it("reparte los errores de VALIDACION en los campos del formulario e ignora los demás", () => {
    const error = new ErrorApi(400, "VALIDACION", "Revisa los datos.", [
      { campo: "precio", mensaje: "No puede ser negativo.", hoja: null, fila: null },
      { campo: "otro", mensaje: "No está en el formulario.", hoja: null, fila: null },
    ]);
    const setError = vi.fn();

    expect(aplicarErroresDeCampo<{ nombre: string; precio: string }>(error, setError, campos)).toBe(true);
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith("precio", { type: "servidor", message: "No puede ser negativo." });
  });

  it("lleva un código de negocio al campo indicado", () => {
    const error = new ErrorApi(409, "CATEGORIA_DUPLICADA", "Ya existe una categoría con ese nombre.");
    expect(
      erroresDeCampo<{ nombre: string; precio: string }>(error, campos, { CATEGORIA_DUPLICADA: "nombre" }),
    ).toEqual([{ campo: "nombre", mensaje: "Ya existe una categoría con ese nombre." }]);
  });

  it("devuelve false si ningún error corresponde a un campo", () => {
    const setError = vi.fn();
    expect(
      aplicarErroresDeCampo<{ nombre: string; precio: string }>(
        new ErrorApi(500, "ERROR_INTERNO", null),
        setError,
        campos,
      ),
    ).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
