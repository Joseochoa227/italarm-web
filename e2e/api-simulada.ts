import type { Page, Route } from "@playwright/test";

export const API = "http://localhost:8080/api/v1";
export const USUARIO = { id: 1, nombre: "Jose Ochoa", correo: "jose@italarm.test" };
const CONTRASENA_INICIAL = "Italarm#2026";
const HOY = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
const AYER = new Date(Date.parse(`${HOY}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
};

function problema(route: Route, status: number, codigo: string, detail: string) {
  return route.fulfill({
    status,
    contentType: "application/problem+json",
    headers: CORS,
    body: JSON.stringify({ type: "about:blank", status, codigo, detail, correlationId: "e2e" }),
  });
}

function json(route: Route, status: number, cuerpo?: unknown) {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers: CORS,
    ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
  });
}

const pagina = (contenido: unknown[]) => ({
  contenido,
  pagina: 0,
  tamano: 20,
  totalElementos: contenido.length,
  totalPaginas: contenido.length ? 1 : 0,
});

type Registro = Record<string, unknown> & { id: number };

/**
 * Backend simulado con estado, que responde como el contrato: sesión, contraseña, tasas,
 * configuración, categorías, unidades, productos, clientes y proveedores.
 */
export async function simularApi(page: Page, opciones: { bolivarDeHoy?: boolean } = {}) {
  const estado = {
    contrasena: CONTRASENA_INICIAL,
    tokens: new Set<string>(),
    siguiente: 1,
    bolivar: { id: 2, valor: "50.000000", fecha: opciones.bolivarDeHoy === false ? AYER : HOY },
    productos: [] as Registro[],
    clientes: [] as Registro[],
    proveedores: [] as Registro[],
    id: 100,
  };
  const categorias = [{ id: 1, nombre: "Cámaras", cantidadProductos: 0, version: 0 }];
  const unidades = [
    { id: 1, nombre: "Unidad", abreviatura: "und", admiteDecimales: false, version: 0 },
    { id: 2, nombre: "Metro", abreviatura: "m", admiteDecimales: true, version: 0 },
  ];

  const vigentes = () => {
    const deHoy = estado.bolivar.fecha === HOY;
    return {
      hoy: HOY,
      trmAutomaticaFallo: false,
      trm: {
        id: 1,
        par: "USD_COP",
        valor: "3912.450000",
        fecha: HOY,
        fuente: "SUPERFINANCIERA",
        esDeHoy: true,
      },
      bolivar: {
        id: estado.bolivar.id,
        par: "USD_VES",
        valor: estado.bolivar.valor,
        fecha: estado.bolivar.fecha,
        fuente: "MANUAL",
        registradaPor: USUARIO.nombre,
        esDeHoy: deHoy,
        ...(deHoy
          ? {}
          : { aviso: "No se ha registrado la tasa del bolívar de hoy. Se está usando la del día anterior." }),
      },
    };
  };

  const productoVista = (p: Registro) => {
    const unidad = unidades.find((u) => u.id === p.unidadMedidaId);
    const categoria = categorias.find((c) => c.id === p.categoriaId);
    const moneda = (p.monedaPrecio as string | undefined) ?? "USD";
    return {
      ...p,
      categoria: { id: categoria?.id, nombre: categoria?.nombre },
      unidadMedida: unidad,
      precioInstalador: { monto: p.precioInstalador, moneda },
      precioClienteFinal: { monto: p.precioClienteFinal, moneda },
      stock: "0",
      bajoMinimo: false,
      activo: true,
      version: 0,
    };
  };

  await page.route(`${API}/**`, async (route) => {
    const peticion = route.request();
    const url = new URL(peticion.url());
    const ruta = url.pathname.replace("/api/v1", "");
    const metodo = peticion.method();
    if (metodo === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    const token = (await peticion.headerValue("authorization"))?.replace("Bearer ", "") ?? "";

    if (ruta === "/sesion" && metodo === "POST") {
      const { correo, contrasena } = peticion.postDataJSON() as { correo: string; contrasena: string };
      if (correo !== USUARIO.correo || contrasena !== estado.contrasena) {
        return problema(route, 401, "CREDENCIALES_INVALIDAS", "El correo o la contraseña no son correctos.");
      }
      const nuevo = `token-${String(estado.siguiente++)}`;
      estado.tokens.add(nuevo);
      return json(route, 200, { token: nuevo, usuario: USUARIO });
    }
    if (!estado.tokens.has(token))
      return problema(route, 401, "NO_AUTENTICADO", "Tu sesión terminó. Ingresa de nuevo.");

    const cuerpo = () => peticion.postDataJSON() as Record<string, unknown>;
    const porId = (lista: Registro[]) => lista.find((r) => ruta.endsWith(`/${String(r.id)}`));

    switch (`${metodo} ${ruta.replace(/\/\d+(?=\/|$)/g, "/{id}")}`) {
      case "GET /sesion":
        return json(route, 200, USUARIO);
      case "DELETE /sesion":
        estado.tokens.delete(token);
        return json(route, 204);
      case "PUT /usuarios/actual/contrasena": {
        const c = cuerpo();
        if (c.contrasenaActual !== estado.contrasena) {
          return problema(route, 409, "CONTRASENA_ACTUAL_INCORRECTA", "La contraseña actual no es correcta.");
        }
        estado.contrasena = c.contrasenaNueva as string;
        estado.tokens = new Set([token]);
        return json(route, 204);
      }
      case "GET /tasas/vigentes":
        return json(route, 200, vigentes());
      case "POST /tasas/vista-previa": {
        const valor = cuerpo().valor as string;
        const porcentaje = ((Number(valor) / Number(estado.bolivar.valor) - 1) * 100).toFixed(2);
        return json(route, 200, {
          anterior: estado.bolivar.valor,
          nueva: valor,
          porcentaje,
          limite: "5.00",
          superaLimite: Math.abs(Number(porcentaje)) > 5,
        });
      }
      case "POST /tasas/ves": {
        const c = cuerpo();
        estado.bolivar = { id: 3, valor: c.valor as string, fecha: HOY };
        return json(route, 201, { id: 3, par: "USD_VES", valor: c.valor, fecha: HOY, fuente: "MANUAL" });
      }
      case "GET /tasas":
        return json(route, 200, pagina([]));
      case "GET /configuracion":
        return json(route, 200, { empresaNombre: "ITALARM", limiteVariacionTasa: "5.00", version: 0 });
      case "GET /categorias":
        return json(route, 200, categorias);
      case "GET /unidades-medida":
        return json(route, 200, unidades);
      case "GET /productos":
        return json(route, 200, pagina(estado.productos.map(productoVista)));
      case "POST /productos": {
        const nuevo = { ...cuerpo(), id: estado.id++ };
        estado.productos.push(nuevo);
        return json(route, 201, productoVista(nuevo));
      }
      case "GET /productos/{id}": {
        const p = porId(estado.productos);
        return p
          ? json(route, 200, productoVista(p))
          : problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
      }
      case "PUT /productos/{id}/foto": {
        const p = estado.productos.find((r) => ruta.includes(`/${String(r.id)}/`));
        if (!p) return problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
        // El navegador comprime y envía la imagen; se devuelve como enlace "firmado".
        const tipo = /Content-Type: (image\/[a-z]+)/.exec(peticion.postData() ?? "")?.[1] ?? "desconocido";
        p.fotoUrl = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><title>${tipo}</title></svg>`)}`;
        p.fotoTipo = tipo;
        return json(route, 200, productoVista(p));
      }
      case "GET /clientes":
        return json(route, 200, pagina(estado.clientes));
      case "POST /clientes": {
        const c = cuerpo();
        const telefono = String(c.telefono).startsWith("+") ? c.telefono : `+57${String(c.telefono)}`;
        const nuevo: Registro = {
          ...c,
          id: estado.id++,
          telefono,
          precioAplicado: c.tipo,
          precioAplicadoDescripcion:
            c.tipo === "INSTALADOR"
              ? "Se le aplicará el precio instalador"
              : "Se le aplicará el precio cliente final",
          cantidadMovimientos: 0,
          version: 0,
        };
        estado.clientes.push(nuevo);
        return json(route, 201, nuevo);
      }
      case "GET /clientes/{id}": {
        const c = porId(estado.clientes);
        return c ? json(route, 200, c) : problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
      }
      case "GET /proveedores":
        return json(route, 200, pagina(estado.proveedores));
    }
    if (/^\/clientes\/\d+\/historial$/.test(ruta) && metodo === "GET") {
      return json(route, 200, { clienteId: 0, nombre: "", compras: 0, instalaciones: 0, movimientos: [] });
    }
    return problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
  });

  return { CONTRASENA_INICIAL, estado };
}

/** Ingresa con la contraseña inicial. */
export async function ingresar(page: Page) {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(USUARIO.correo);
  await page.getByLabel("Contraseña", { exact: true }).fill(CONTRASENA_INICIAL);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.getByRole("heading", { name: "Hola, Jose" }).waitFor();
}
