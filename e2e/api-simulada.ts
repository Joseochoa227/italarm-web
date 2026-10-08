import type { Page, Route } from "@playwright/test";

export const API = "http://localhost:8080/api/v1";
export const USUARIO = { id: 1, nombre: "Jose Ochoa", correo: "jose@italarm.test" };
const CONTRASENA_INICIAL = "Italarm#2026";
const HOY = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
const AYER = new Date(Date.parse(`${HOY}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
  "Access-Control-Allow-Headers": "Authorization,Content-Type,Idempotency-Key",
  "Access-Control-Expose-Headers": "Content-Disposition",
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
interface Dinero {
  monto: string;
  moneda: string;
}
interface Serial {
  id: number;
  numero: string;
  estado: string;
  productoId: number;
  documentoEntrada: Documento;
  documentoSalida?: Documento;
}
interface Documento {
  tipo: string;
  id: number;
  consecutivo: string;
}

const TRM = 3912.45;
const usd = (valor: number): Dinero => ({ monto: valor.toFixed(4), moneda: "USD" });
const cantidadTexto = (valor: number) => String(Math.round(valor * 100) / 100);

/**
 * Backend simulado con estado, que responde como el contrato: sesión, contraseña, tasas,
 * configuración, categorías, unidades, productos, clientes, proveedores, inventario, compras,
 * ajustes y carga inicial.
 */
export async function simularApi(page: Page, opciones: { bolivarDeHoy?: boolean } = {}) {
  const estado = {
    contrasena: CONTRASENA_INICIAL,
    tokens: new Set<string>(),
    siguiente: 1,
    bolivar: { id: 2, valor: "50.000000", fecha: opciones.bolivarDeHoy === false ? AYER : HOY },
    productos: [] as Registro[],
    seriales: [] as Serial[],
    kardex: [] as Registro[],
    historialCosto: [] as Registro[],
    compras: [] as Registro[],
    ajustes: [] as Registro[],
    cargas: [] as Registro[],
    claves: new Map<string, Registro>(),
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
      stock: cantidadTexto(Number(p.stock ?? 0)),
      bajoMinimo: false,
      activo: true,
      version: 0,
    };
  };

  // Inventario simulado (Fase 2): stock, costo en USD, seriales, kárdex e historial de costo.
  const unidadDe = (p: Registro) => unidades.find((u) => u.id === p.unidadMedidaId)?.abreviatura ?? "";
  const costoDe = (p: Registro) => (typeof p.costo === "number" ? p.costo : null);
  const stockDe = (p: Registro) => Number(p.stock ?? 0);
  const valorEnBodega = (p: Registro) => {
    const costo = costoDe(p);
    return costo === null ? {} : { usd: usd(costo * stockDe(p)) };
  };
  const inventarioVista = (p: Registro) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    categoria: categorias.find((c) => c.id === p.categoriaId)?.nombre,
    abreviatura: unidadDe(p),
    controlaSerial: p.controlaSerial,
    stock: cantidadTexto(stockDe(p)),
    bajoMinimo: false,
    activo: true,
    ...(costoDe(p) === null ? {} : { costoActualUsd: usd(costoDe(p) ?? 0) }),
    valorEnBodega: valorEnBodega(p),
  });
  const contar = (p: Registro, estadoSerial: string) =>
    estado.seriales.filter((x) => x.productoId === p.id && x.estado === estadoSerial).length;
  const detalleInventario = (p: Registro) => ({
    ...inventarioVista(p),
    avisos: [],
    ...(costoDe(p) === null ? {} : { costoActual: { usd: usd(costoDe(p) ?? 0) } }),
    precioInstalador: { usd: { monto: p.precioInstalador, moneda: "USD" } },
    precioClienteFinal: { usd: { monto: p.precioClienteFinal, moneda: "USD" } },
    seriales: {
      enBodega: contar(p, "EN_BODEGA"),
      vendidos: 0,
      instalados: 0,
      dadosDeBaja: contar(p, "DADO_DE_BAJA"),
      anulados: 0,
    },
  });
  const serialVista = (x: Serial) => {
    const p = estado.productos.find((r) => r.id === x.productoId);
    return { ...x, fechaEntrada: HOY, producto: { id: p?.id, codigo: p?.codigo, nombre: p?.nombre } };
  };
  /** Regla de costo (P-19): sube al mayor; si baja o es igual, promedia; sin stock, la de la factura. */
  const nuevoCosto = (p: Registro, cantidad: number, costoUsd: number) => {
    const stock = stockDe(p);
    const actual = costoDe(p);
    if (stock <= 0 || actual === null) return { costo: costoUsd, regla: "SIN_STOCK" };
    if (costoUsd > actual) return { costo: costoUsd, regla: "SUBE" };
    return { costo: (stock * actual + cantidad * costoUsd) / (stock + cantidad), regla: "PROMEDIO" };
  };
  const aUsd = (monto: number, moneda: string) =>
    moneda === "COP" ? monto / TRM : moneda === "VES" ? monto / Number(estado.bolivar.valor) : monto;
  const tasasCompra = () => ({
    trm: String(TRM),
    fechaTrm: HOY,
    tasaVes: estado.bolivar.valor,
    fechaTasaVes: estado.bolivar.fecha,
  });
  const moverStock = (p: Registro, documento: Documento, cantidad: number, detalle?: string) => {
    p.stock = stockDe(p) + cantidad;
    estado.kardex.push({
      id: estado.id++,
      productoId: p.id,
      fecha: HOY,
      tipo: documento.tipo,
      tipoEtiqueta:
        documento.tipo === "COMPRA" ? "Compra" : cantidad > 0 ? "Ajuste (entrada)" : "Ajuste (salida)",
      ...(detalle ? { detalle } : {}),
      documento,
      ...(cantidad > 0 ? { entrada: cantidadTexto(cantidad) } : { salida: cantidadTexto(-cantidad) }),
      saldo: cantidadTexto(stockDe(p)),
      usuario: USUARIO.nombre,
    });
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
      case "GET /inventario":
        return json(route, 200, {
          totalProductos: estado.productos.length,
          valorTotal: {
            usd: usd(estado.productos.reduce((t, p) => t + (costoDe(p) ?? 0) * stockDe(p), 0)),
          },
          avisos: [],
          productos: pagina(estado.productos.map(inventarioVista)),
        });
      case "GET /inventario/productos/{id}": {
        const p = porId(estado.productos);
        return p
          ? json(route, 200, detalleInventario(p))
          : problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
      }
      case "GET /inventario/productos/{id}/kardex": {
        const id = Number(ruta.split("/")[3]);
        return json(route, 200, pagina(estado.kardex.filter((k) => k.productoId === id).reverse()));
      }
      case "GET /inventario/productos/{id}/historial-costo": {
        const id = Number(ruta.split("/")[3]);
        return json(route, 200, estado.historialCosto.filter((h) => h.productoId === id).reverse());
      }
      case "GET /inventario/productos/{id}/seriales": {
        const id = Number(ruta.split("/")[3]);
        const filtro = url.searchParams.get("estado");
        return json(
          route,
          200,
          estado.seriales
            .filter((x) => x.productoId === id && (!filtro || x.estado === filtro))
            .map(serialVista),
        );
      }
      case "GET /seriales": {
        const numero = (url.searchParams.get("numero") ?? "").toUpperCase();
        return json(route, 200, estado.seriales.filter((x) => x.numero.includes(numero)).map(serialVista));
      }
      case "POST /compras/vista-previa": {
        const c = cuerpo();
        const moneda = c.moneda as string;
        const lineas = (c.lineas as { productoId: number; cantidad: string; costoUnitario: string }[]).map(
          (l) => {
            const p = estado.productos.find((r) => r.id === l.productoId) ?? { id: 0 };
            const costoUsd = aUsd(Number(l.costoUnitario), moneda);
            const cambio = nuevoCosto(p, Number(l.cantidad), costoUsd);
            const subtotal = Number(l.cantidad) * Number(l.costoUnitario);
            return {
              productoId: l.productoId,
              nombre: p.nombre,
              abreviatura: unidadDe(p),
              cantidad: l.cantidad,
              stockActual: cantidadTexto(stockDe(p)),
              ...(costoDe(p) === null ? {} : { costoActualUsd: usd(costoDe(p) ?? 0) }),
              costoNuevoUsd: usd(cambio.costo),
              regla: cambio.regla,
              subtotal: {
                [moneda.toLowerCase()]: { monto: subtotal.toFixed(4), moneda },
                usd: usd(aUsd(subtotal, moneda)),
              },
            };
          },
        );
        const total = lineas.reduce((t, l) => t + Number(Object.values(l.subtotal)[0]?.monto ?? 0), 0);
        return json(route, 200, {
          fecha: HOY,
          moneda,
          tasas: tasasCompra(),
          avisos: [],
          lineas,
          total: {
            [moneda.toLowerCase()]: { monto: total.toFixed(4), moneda },
            usd: usd(aUsd(total, moneda)),
          },
        });
      }
      case "POST /compras": {
        const clave = (await peticion.headerValue("idempotency-key")) ?? "";
        const repetida = estado.claves.get(clave);
        if (repetida) return json(route, 201, repetida);
        const c = cuerpo();
        const moneda = c.moneda as string;
        const id = estado.id++;
        const documento = {
          tipo: "COMPRA",
          id,
          consecutivo: `C-${String(estado.compras.length + 1).padStart(4, "0")}`,
        };
        const proveedor = estado.proveedores.find((r) => r.id === c.proveedorId);
        let total = 0;
        const lineas = (
          c.lineas as { productoId: number; cantidad: string; costoUnitario: string; seriales?: string[] }[]
        ).map((l) => {
          const p = estado.productos.find((r) => r.id === l.productoId) ?? { id: 0 };
          const cantidad = Number(l.cantidad);
          const costoUsd = aUsd(Number(l.costoUnitario), moneda);
          const anterior = costoDe(p);
          const cambio = nuevoCosto(p, cantidad, costoUsd);
          p.costo = cambio.costo;
          moverStock(p, documento, cantidad);
          estado.historialCosto.push({
            id: estado.id++,
            productoId: p.id,
            fecha: HOY,
            documento,
            costoFactura: { monto: Number(l.costoUnitario).toFixed(4), moneda },
            ...(moneda === "USD" ? {} : { tasaFactura: String(TRM) }),
            ...(anterior === null ? {} : { costoAnteriorUsd: usd(anterior) }),
            costoNuevoUsd: usd(cambio.costo),
            regla: cambio.regla,
          });
          for (const numero of l.seriales ?? []) {
            estado.seriales.push({
              id: estado.id++,
              numero,
              estado: "EN_BODEGA",
              productoId: p.id,
              documentoEntrada: documento,
            });
          }
          const subtotal = cantidad * Number(l.costoUnitario);
          total += subtotal;
          return {
            productoId: p.id,
            codigo: p.codigo,
            nombre: p.nombre,
            abreviatura: unidadDe(p),
            cantidad: l.cantidad,
            costoUnitario: { monto: Number(l.costoUnitario).toFixed(4), moneda },
            subtotal: { monto: subtotal.toFixed(4), moneda },
            ...(anterior === null ? {} : { costoAnteriorUsd: usd(anterior) }),
            costoNuevoUsd: usd(cambio.costo),
            regla: cambio.regla,
            seriales: l.seriales ?? [],
          };
        });
        const compra: Registro = {
          ...documento,
          estado: "ACTIVA",
          proveedor: { id: proveedor?.id, nombre: proveedor?.nombre },
          numeroFactura: c.numeroFactura,
          fecha: c.fecha ?? HOY,
          moneda,
          tasas: tasasCompra(),
          registradaPor: USUARIO.nombre,
          registradaEn: new Date().toISOString(),
          lineas,
          total: { monto: total.toFixed(4), moneda },
          totalUsd: usd(aUsd(total, moneda)),
          anulable: true,
        };
        estado.compras.push(compra);
        estado.claves.set(clave, compra);
        return json(route, 201, compra);
      }
      case "GET /compras/{id}": {
        const c = porId(estado.compras);
        return c ? json(route, 200, c) : problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
      }
      case "GET /compras":
        return json(route, 200, {
          desde: HOY,
          hasta: HOY,
          totalesPorMoneda: [],
          compras: pagina([...estado.compras].reverse()),
        });
      case "POST /ajustes": {
        const c = cuerpo();
        const p = estado.productos.find((r) => r.id === c.productoId);
        if (!p) return problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
        const cantidad = Number(c.cantidad);
        if (stockDe(p) + cantidad < 0) {
          return problema(
            route,
            422,
            "STOCK_INSUFICIENTE",
            `Stock insuficiente · quedan ${cantidadTexto(stockDe(p))} ${unidadDe(p)}`,
          );
        }
        const id = estado.id++;
        const documento = {
          tipo: "AJUSTE",
          id,
          consecutivo: `AJ-${String(estado.ajustes.length + 1).padStart(3, "0")}`,
        };
        const seriales = (c.seriales as string[] | undefined) ?? [];
        for (const numero of seriales) {
          const existente = estado.seriales.find((x) => x.productoId === p.id && x.numero === numero);
          if (cantidad < 0 && existente)
            Object.assign(existente, { estado: "DADO_DE_BAJA", documentoSalida: documento });
          if (cantidad > 0) {
            estado.seriales.push({
              id: estado.id++,
              numero,
              estado: "EN_BODEGA",
              productoId: p.id,
              documentoEntrada: documento,
            });
          }
        }
        moverStock(p, documento, cantidad, c.motivo as string);
        const ajuste: Registro = {
          ...documento,
          fecha: HOY,
          tipo: cantidad > 0 ? "ENTRADA" : "SALIDA",
          motivo: c.motivo,
          motivoEtiqueta:
            c.motivo === "DANO" ? "Daño" : c.motivo === "CONTEO_FISICO" ? "Conteo físico" : c.motivo,
          producto: { id: p.id, codigo: p.codigo, nombre: p.nombre },
          cantidad: cantidadTexto(Math.abs(cantidad)),
          abreviatura: unidadDe(p),
          ...(costoDe(p) === null
            ? {}
            : {
                costoUnitarioUsd: usd(costoDe(p) ?? 0),
                valorUsd: usd((costoDe(p) ?? 0) * Math.abs(cantidad)),
              }),
          seriales,
          registradoPor: USUARIO.nombre,
          registradoEn: new Date().toISOString(),
        };
        estado.ajustes.push(ajuste);
        return json(route, 201, ajuste);
      }
      case "GET /ajustes/{id}": {
        const a = porId(estado.ajustes);
        return a ? json(route, 200, a) : problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
      }
      case "GET /carga-inicial":
        return json(route, 200, estado.cargas);
      case "POST /carga-inicial/validar":
        // El archivo «con-error.xlsx» trae un error en la fila 8 del inventario (CP-29).
        return (peticion.postData() ?? "").includes("con-error.xlsx")
          ? json(route, 200, {
              valido: false,
              errores: [
                {
                  hoja: "Inventario inicial",
                  fila: 8,
                  mensaje: "El producto CAM-X no existe en la hoja Productos.",
                },
              ],
            })
          : json(route, 200, {
              valido: true,
              errores: [],
              resumen: {
                productos: 2,
                clientes: 1,
                proveedores: 1,
                productosConStock: 2,
                valorUsd: usd(150),
              },
            });
      case "POST /carga-inicial": {
        const carga = {
          id: estado.id++,
          consecutivo: `II-${String(estado.cargas.length + 1).padStart(3, "0")}`,
          fecha: HOY,
          registradaPor: USUARIO.nombre,
          archivo: "inventario.xlsx",
          productosCreados: 2,
          clientesCreados: 1,
          proveedoresCreados: 1,
          productosConStock: 2,
          valorUsd: usd(150),
        };
        estado.cargas.push(carga);
        return json(route, 201, carga);
      }
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
