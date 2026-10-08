import { comoErrorApi, ErrorApi, leerProblema, RESPUESTA_INVALIDA, SIN_CONEXION } from "./problema";

function respuesta(cuerpo: unknown, status: number, cabeceras: Record<string, string> = {}) {
  return new Response(typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/problem+json", ...cabeceras },
  });
}

describe("leerProblema (guía §2)", () => {
  it("lee código, detalle, errores por campo y correlationId", async () => {
    const error = await leerProblema(
      respuesta(
        {
          status: 400,
          title: "Datos inválidos",
          detail: "Revisa los datos ingresados.",
          codigo: "VALIDACION",
          correlationId: "5b0c",
          errores: [{ campo: "precioInstalador", mensaje: "El precio no puede ser negativo." }],
        },
        400,
      ),
    );

    expect(error).toBeInstanceOf(ErrorApi);
    expect(error.status).toBe(400);
    expect(error.codigo).toBe("VALIDACION");
    expect(error.detalle).toBe("Revisa los datos ingresados.");
    expect(error.correlationId).toBe("5b0c");
    expect(error.errorDeCampo("precioInstalador")).toBe("El precio no puede ser negativo.");
    expect(error.errorDeCampo("otro")).toBeUndefined();
    expect(error.message).toBe("Revisa los datos ingresados.");
  });

  it("nombra los campos de las listas como React Hook Form", async () => {
    const error = await leerProblema(
      respuesta(
        {
          codigo: "VALIDACION",
          errores: [{ campo: "lineas[2].seriales[0]", mensaje: "Hay un serial vacío." }],
        },
        400,
      ),
    );
    expect(error.errorDeCampo("lineas.2.seriales.0")).toBe("Hay un serial vacío.");
  });

  it("lee los errores por hoja y fila de la carga inicial", async () => {
    const error = await leerProblema(
      respuesta(
        {
          codigo: "CARGA_INICIAL_CON_ERRORES",
          errores: [{ hoja: "Productos", fila: 7, mensaje: "Falta el código." }],
        },
        400,
      ),
    );
    expect(error.errores).toEqual([{ campo: null, hoja: "Productos", fila: 7, mensaje: "Falta el código." }]);
  });

  it("sin cuerpo JSON o sin código devuelve RESPUESTA_INVALIDA con la cabecera de correlación", async () => {
    const html = await leerProblema(
      respuesta("<html>Bad gateway</html>", 502, { "X-Correlation-Id": "c-1" }),
    );
    expect(html.codigo).toBe(RESPUESTA_INVALIDA);
    expect(html.status).toBe(502);
    expect(html.correlationId).toBe("c-1");

    const sinCodigo = await leerProblema(respuesta({ detail: "algo" }, 400));
    expect(sinCodigo.codigo).toBe(RESPUESTA_INVALIDA);
    expect(sinCodigo.correlationId).toBeNull();
  });

  it("toma el correlationId de la cabecera si el cuerpo no lo trae", async () => {
    const error = await leerProblema(
      respuesta({ codigo: "STOCK_INSUFICIENTE" }, 422, { "X-Correlation-Id": "c-2" }),
    );
    expect(error.correlationId).toBe("c-2");
    expect(error.detalle).toBeNull();
    expect(error.message).toBe("STOCK_INSUFICIENTE");
  });
});

describe("comoErrorApi", () => {
  it("deja igual un ErrorApi y convierte cualquier otro error en SIN_CONEXION", () => {
    const original = new ErrorApi(409, "SERIAL_DUPLICADO", "Ya existe.");
    expect(comoErrorApi(original)).toBe(original);
    expect(comoErrorApi(new TypeError("Failed to fetch")).codigo).toBe(SIN_CONEXION);
  });
});
