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
    ventas: [] as Registro[],
    instalaciones: [] as Registro[],
    reclamos: [] as Registro[],
    cotizaciones: [] as Registro[],
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
        documento.tipo === "COMPRA"
          ? "Compra"
          : documento.tipo === "VENTA"
            ? cantidad > 0
              ? "Anulación de venta"
              : "Venta"
            : cantidad > 0
              ? "Ajuste (entrada)"
              : "Ajuste (salida)",
      ...(detalle ? { detalle } : {}),
      documento,
      ...(cantidad > 0 ? { entrada: cantidadTexto(cantidad) } : { salida: cantidadTexto(-cantidad) }),
      saldo: cantidadTexto(stockDe(p)),
      usuario: USUARIO.nombre,
    });
  };

  // Ventas simuladas (Fase 3): precio por tipo de cliente, stock, seriales y utilidad en USD.
  const desdeUsd = (monto: number, moneda: string) =>
    moneda === "COP" ? monto * TRM : moneda === "VES" ? monto * Number(estado.bolivar.valor) : monto;
  const enMonedas = (montoUsd: number) => ({
    usd: usd(montoUsd),
    cop: { monto: (montoUsd * TRM).toFixed(4), moneda: "COP" },
    ves: { monto: (montoUsd * Number(estado.bolivar.valor)).toFixed(4), moneda: "VES" },
  });
  const calcularVenta = (c: Record<string, unknown>) => {
    const cliente = estado.clientes.find((r) => r.id === c.clienteId);
    const moneda = c.moneda as string;
    const lineas = (
      c.lineas as { productoId: number; cantidad?: string; seriales?: string[]; precioUnitario?: string }[]
    ).map((l) => {
      const p = estado.productos.find((r) => r.id === l.productoId) ?? { id: 0 };
      const cantidad = l.cantidad ? Number(l.cantidad) : (l.seriales?.length ?? 0);
      const base = Number(cliente?.tipo === "INSTALADOR" ? p.precioInstalador : p.precioClienteFinal);
      const sugerido = desdeUsd(base, moneda);
      const precio = l.precioUnitario === undefined ? sugerido : Number(l.precioUnitario);
      const costo = costoDe(p) ?? 0;
      return { l, p, cantidad, sugerido, precio, costo, subtotalUsd: aUsd(precio * cantidad, moneda) };
    });
    const subtotalUsd = lineas.reduce((t, x) => t + x.subtotalUsd, 0);
    const valor = Number(c.descuentoValor ?? 0);
    const descuentoUsd =
      c.descuentoTipo === "PORCENTAJE"
        ? (subtotalUsd * valor) / 100
        : c.descuentoTipo === "VALOR"
          ? aUsd(valor, moneda)
          : 0;
    const totalUsd = subtotalUsd - descuentoUsd;
    const costoUsd = lineas.reduce((t, x) => t + x.costo * x.cantidad, 0);
    const resumen = {
      material: enMonedas(subtotalUsd),
      subtotal: enMonedas(subtotalUsd),
      descuento: enMonedas(descuentoUsd),
      total: enMonedas(totalUsd),
      costo: enMonedas(costoUsd),
      utilidad: enMonedas(totalUsd - costoUsd),
      porcentajeUtilidad: totalUsd > 0 ? (((totalUsd - costoUsd) / totalUsd) * 100).toFixed(2) : "0",
    };
    const clienteVista = {
      id: cliente?.id,
      tipo: cliente?.tipo,
      nombre: cliente?.nombre,
      telefono: cliente?.telefono,
      precioAplicado: cliente?.precioAplicadoDescripcion,
    };
    return { moneda, lineas, resumen, totalUsd, costoUsd, clienteVista };
  };
  const masMeses = (fecha: string, meses: number) => {
    const [a, m, d] = fecha.split("-").map(Number);
    return new Date(Date.UTC(a ?? 2026, (m ?? 1) - 1 + meses, d ?? 1)).toISOString().slice(0, 10);
  };
  const tresMeses = () => masMeses(HOY, 3);
  const fotoSvg = (texto: string) =>
    `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#5980a6"/><title>${texto}</title></svg>`)}`;
  // Instalaciones simuladas (Fase 4): material como en ventas, más mano de obra y garantías.
  const calcularInstalacion = (c: Record<string, unknown>) => {
    const v = calcularVenta({ ...c, descuentoTipo: undefined });
    const moneda = c.moneda as string;
    const fecha = (c.fecha as string | undefined) ?? HOY;
    const meses = Number(c.garantiaManoObraMeses ?? 3);
    const materialUsd = v.lineas.reduce((t, x) => t + x.subtotalUsd, 0);
    const manoUsd = aUsd(Number(c.manoDeObra ?? 0), moneda);
    const subtotalUsd = materialUsd + manoUsd;
    const valor = Number(c.descuentoValor ?? 0);
    const descuentoUsd =
      c.descuentoTipo === "PORCENTAJE"
        ? (subtotalUsd * valor) / 100
        : c.descuentoTipo === "VALOR"
          ? aUsd(valor, moneda)
          : 0;
    const totalUsd = subtotalUsd - descuentoUsd;
    const resumen = {
      ...v.resumen,
      material: enMonedas(materialUsd),
      manoDeObra: enMonedas(manoUsd),
      subtotal: enMonedas(subtotalUsd),
      descuento: enMonedas(descuentoUsd),
      total: enMonedas(totalUsd),
      utilidad: enMonedas(totalUsd - v.costoUsd),
      porcentajeUtilidad: totalUsd > 0 ? (((totalUsd - v.costoUsd) / totalUsd) * 100).toFixed(2) : "0",
    };
    const garantias = {
      manoObraMeses: meses,
      venceManoObra: masMeses(fecha, meses),
      estadoManoObra: "VIGENTE",
      ...(v.lineas.length > 0 ? { venceEquipos: masMeses(fecha, 3), estadoEquipos: "VIGENTE" } : {}),
      condiciones:
        (c.condicionesGarantia as string | undefined) ?? "No cubre daños por descargas eléctricas.",
    };
    return { ...v, fecha, resumen, totalUsd, garantias };
  };

  // Cotizaciones simuladas (Fase 5): el cobro como en ventas o instalaciones, sin mover inventario.
  const calcularCotizacion = (c: Record<string, unknown>) => {
    const lineas = (c.lineas as Record<string, unknown>[] | undefined) ?? [];
    return c.tipo === "INSTALACION"
      ? calcularInstalacion({ ...c, lineas })
      : { ...calcularVenta({ ...c, lineas }), garantias: undefined };
  };
  const vence = (dias: number) =>
    new Date(Date.parse(`${HOY}T12:00:00Z`) + dias * 86_400_000).toISOString().slice(0, 10);
  const lineasPrevia = (v: ReturnType<typeof calcularVenta>) =>
    v.lineas.map((x) => ({
      productoId: x.p.id,
      codigo: x.p.codigo,
      nombre: x.p.nombre,
      abreviatura: unidadDe(x.p),
      controlaSerial: x.p.controlaSerial,
      cantidad: cantidadTexto(x.cantidad),
      disponible: cantidadTexto(stockDe(x.p)),
      ...(x.cantidad > stockDe(x.p)
        ? { avisoStock: `Stock insuficiente · quedan ${cantidadTexto(stockDe(x.p))} ${unidadDe(x.p)}` }
        : {}),
      precioSugerido: { monto: x.sugerido.toFixed(4), moneda: v.moneda },
      precioUnitario: { monto: x.precio.toFixed(4), moneda: v.moneda },
      subtotal: enMonedas(x.subtotalUsd),
      costoUnitarioHoy: enMonedas(x.costo),
    }));
  const vistaCotizacion = (c: Record<string, unknown>, base: Partial<Registro>) => {
    const v = calcularCotizacion(c);
    const dias = Number(c.validezDias ?? 15);
    return {
      ...base,
      tipo: c.tipo,
      fecha: HOY,
      validezDias: dias,
      vence: vence(dias),
      diasParaVencer: dias,
      porVencer: dias <= 3,
      moneda: v.moneda,
      cliente: v.clienteVista,
      descripcion: c.descripcion,
      tasas: tasasCompra(),
      lineas: v.lineas.map((x) => ({
        productoId: x.p.id,
        codigo: x.p.codigo,
        descripcion: x.p.nombre,
        unidad: unidadDe(x.p),
        cantidad: cantidadTexto(x.cantidad),
        precioSugerido: { monto: x.sugerido.toFixed(4), moneda: v.moneda },
        precioUnitario: { monto: x.precio.toFixed(4), moneda: v.moneda },
        subtotal: { monto: (x.precio * x.cantidad).toFixed(4), moneda: v.moneda },
        costoUnitarioUsd: usd(x.costo),
      })),
      resumen: v.resumen,
      total: { monto: desdeUsd(v.totalUsd, v.moneda).toFixed(4), moneda: v.moneda },
      utilidad: usd(v.totalUsd - v.costoUsd),
      porcentajeUtilidad: v.resumen.porcentajeUtilidad,
      ...(c.descuentoTipo ? { descuentoTipo: c.descuentoTipo, descuentoValor: c.descuentoValor } : {}),
      monedasComprobante: c.monedasComprobante ?? [],
      solicitud: c,
    };
  };
  /** Al guardar una venta o instalación con `cotizacionId`, la cotización queda Convertida (RF-95). */
  const convertir = (c: Record<string, unknown>, documento: Documento & { tipo: string }) => {
    const cot = estado.cotizaciones.find((r) => r.id === c.cotizacionId);
    if (!cot) return {};
    Object.assign(cot, { estado: "CONVERTIDA", documentoGenerado: { ...documento, fecha: HOY } });
    return { cotizacion: { id: cot.id, consecutivo: cot.consecutivo } };
  };
  /** Al anular el documento generado, la cotización vuelve a Aprobada (RF-74). */
  const revertir = (documento: Registro) => {
    const origen = documento.cotizacion as { id?: number } | undefined;
    const cot = estado.cotizaciones.find((r) => r.id === origen?.id);
    if (cot) {
      cot.estado = "APROBADA";
      delete cot.documentoGenerado;
    }
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

    if (metodo === "GET" && ruta.endsWith("/excel")) {
      const nombre = `${ruta.split("/").filter(Boolean).slice(0, -1).join("-")}-${HOY}.xlsx`;
      return route.fulfill({
        status: 200,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers: { ...CORS, "Content-Disposition": `attachment; filename="${nombre}"` },
        body: "xlsx e2e",
      });
    }

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
        return json(route, 200, {
          empresaNombre: "ITALARM",
          limiteVariacionTasa: "5.00",
          garantiaManoObraMeses: 3,
          condicionesGarantia: "No cubre daños por descargas eléctricas.",
          version: 0,
        });
      case "GET /usuarios/tecnicos":
        return json(route, 200, [{ id: USUARIO.id, nombre: USUARIO.nombre }]);
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
      case "POST /ventas/vista-previa": {
        const v = calcularVenta(cuerpo());
        return json(route, 200, {
          fecha: HOY,
          moneda: v.moneda,
          cliente: v.clienteVista,
          tasas: tasasCompra(),
          avisos: [],
          puedeGuardar: v.lineas.every((x) => x.cantidad <= stockDe(x.p)),
          lineas: v.lineas.map((x) => ({
            productoId: x.p.id,
            codigo: x.p.codigo,
            nombre: x.p.nombre,
            abreviatura: unidadDe(x.p),
            controlaSerial: x.p.controlaSerial,
            cantidad: cantidadTexto(x.cantidad),
            disponible: cantidadTexto(stockDe(x.p)),
            ...(x.cantidad > stockDe(x.p)
              ? { avisoStock: `Stock insuficiente · quedan ${cantidadTexto(stockDe(x.p))} ${unidadDe(x.p)}` }
              : {}),
            precioSugerido: { monto: x.sugerido.toFixed(4), moneda: v.moneda },
            precioUnitario: { monto: x.precio.toFixed(4), moneda: v.moneda },
            subtotal: enMonedas(x.subtotalUsd),
            costoUnitarioHoy: enMonedas(x.costo),
          })),
          resumen: v.resumen,
        });
      }
      case "POST /ventas": {
        const clave = (await peticion.headerValue("idempotency-key")) ?? "";
        const repetida = estado.claves.get(clave);
        if (repetida) return json(route, 201, repetida);
        const c = cuerpo();
        const v = calcularVenta(c);
        const sinStock = v.lineas.find((x) => x.cantidad > stockDe(x.p));
        if (sinStock) {
          return problema(
            route,
            422,
            "STOCK_INSUFICIENTE",
            `Stock insuficiente · quedan ${cantidadTexto(stockDe(sinStock.p))}`,
          );
        }
        const id = estado.id++;
        const documento = {
          tipo: "VENTA",
          id,
          consecutivo: `V-${String(estado.ventas.length + 1).padStart(4, "0")}`,
        };
        const vence = tresMeses();
        const lineas = v.lineas.map((x) => {
          moverStock(x.p, documento, -x.cantidad);
          const seriales = (x.l.seriales ?? []).map((numero) => {
            const s = estado.seriales.find((r) => r.productoId === x.p.id && r.numero === numero);
            if (s) Object.assign(s, { estado: "VENDIDO", documentoSalida: documento });
            return { id: s?.id, numero, vencimientoGarantia: vence };
          });
          return {
            productoId: x.p.id,
            codigo: x.p.codigo,
            descripcion: x.p.nombre,
            unidad: unidadDe(x.p),
            cantidad: cantidadTexto(x.cantidad),
            precioSugerido: { monto: x.sugerido.toFixed(4), moneda: v.moneda },
            precioUnitario: { monto: x.precio.toFixed(4), moneda: v.moneda },
            subtotal: { monto: (x.precio * x.cantidad).toFixed(4), moneda: v.moneda },
            costoUnitarioUsd: usd(x.costo),
            seriales,
          };
        });
        const nueva: Registro = {
          ...documento,
          estado: "ACTIVA",
          fecha: HOY,
          moneda: v.moneda,
          cliente: v.clienteVista,
          tasas: tasasCompra(),
          lineas,
          resumen: v.resumen,
          total: { monto: desdeUsd(v.totalUsd, v.moneda).toFixed(4), moneda: v.moneda },
          utilidad: usd(v.totalUsd - v.costoUsd),
          porcentajeUtilidad: v.resumen.porcentajeUtilidad,
          ...(c.descuentoTipo ? { descuentoTipo: c.descuentoTipo, descuentoValor: c.descuentoValor } : {}),
          monedasComprobante: c.monedasComprobante ?? [],
          registradaPor: USUARIO.nombre,
          registradaEn: new Date().toISOString(),
          version: 0,
        };
        Object.assign(nueva, convertir(c, documento));
        estado.ventas.push(nueva);
        estado.claves.set(clave, nueva);
        return json(route, 201, nueva);
      }
      case "GET /ventas/{id}": {
        const v = porId(estado.ventas);
        return v ? json(route, 200, v) : problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
      }
      case "GET /ventas":
        return json(route, 200, {
          desde: HOY,
          hasta: HOY,
          totalesPorMoneda: [],
          ventas: pagina(
            [...estado.ventas].reverse().map((v) => ({
              ...v,
              cliente: (v.cliente as { nombre?: string } | undefined)?.nombre,
            })),
          ),
        });
      case "POST /ventas/{id}/anular": {
        const v = estado.ventas.find((r) => ruta.includes(`/${String(r.id)}/`));
        if (!v) return problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
        const documento = { tipo: "VENTA", id: v.id, consecutivo: String(v.consecutivo) };
        for (const l of v.lineas as {
          productoId: number;
          cantidad: string;
          seriales: { numero: string }[];
        }[]) {
          const p = estado.productos.find((r) => r.id === l.productoId);
          if (p) moverStock(p, documento, Number(l.cantidad));
          for (const { numero } of l.seriales) {
            const s = estado.seriales.find((r) => r.productoId === l.productoId && r.numero === numero);
            if (s) {
              s.estado = "EN_BODEGA";
              delete s.documentoSalida;
            }
          }
        }
        revertir(v);
        Object.assign(v, {
          estado: "ANULADA",
          anulacion: { motivo: cuerpo().motivo, usuario: USUARIO.nombre, fecha: new Date().toISOString() },
        });
        return json(route, 200, v);
      }
      case "POST /instalaciones/vista-previa": {
        const v = calcularInstalacion(cuerpo());
        return json(route, 200, {
          fecha: v.fecha,
          moneda: v.moneda,
          cliente: v.clienteVista,
          tasas: tasasCompra(),
          avisos: [],
          puedeGuardar: v.lineas.every((x) => x.cantidad <= stockDe(x.p)),
          lineas: v.lineas.map((x) => ({
            productoId: x.p.id,
            nombre: x.p.nombre,
            abreviatura: unidadDe(x.p),
            cantidad: cantidadTexto(x.cantidad),
            disponible: cantidadTexto(stockDe(x.p)),
            ...(x.cantidad > stockDe(x.p)
              ? { avisoStock: `Stock insuficiente · quedan ${cantidadTexto(stockDe(x.p))} ${unidadDe(x.p)}` }
              : {}),
            precioSugerido: { monto: x.sugerido.toFixed(4), moneda: v.moneda },
            precioUnitario: { monto: x.precio.toFixed(4), moneda: v.moneda },
            subtotal: enMonedas(x.subtotalUsd),
            costoUnitarioHoy: enMonedas(x.costo),
          })),
          resumen: v.resumen,
          garantias: v.garantias,
        });
      }
      case "POST /instalaciones": {
        const clave = (await peticion.headerValue("idempotency-key")) ?? "";
        const repetida = estado.claves.get(clave);
        if (repetida) return json(route, 201, repetida);
        const c = cuerpo();
        const v = calcularInstalacion(c);
        const sinStock = v.lineas.find((x) => x.cantidad > stockDe(x.p));
        if (sinStock) return problema(route, 422, "STOCK_INSUFICIENTE", "Stock insuficiente");
        const id = estado.id++;
        const documento = {
          tipo: "INSTALACION",
          id,
          consecutivo: `I-${String(estado.instalaciones.length + 1).padStart(4, "0")}`,
        };
        const lineas = v.lineas.map((x) => {
          moverStock(x.p, documento, -x.cantidad);
          const seriales = (x.l.seriales ?? []).map((numero) => {
            const s = estado.seriales.find((r) => r.productoId === x.p.id && r.numero === numero);
            if (s) Object.assign(s, { estado: "INSTALADO", documentoSalida: documento });
            return { id: s?.id, numero, vencimientoGarantia: v.garantias.venceEquipos };
          });
          return {
            productoId: x.p.id,
            codigo: x.p.codigo,
            descripcion: x.p.nombre,
            unidad: unidadDe(x.p),
            cantidad: cantidadTexto(x.cantidad),
            precioSugerido: { monto: x.sugerido.toFixed(4), moneda: v.moneda },
            precioUnitario: { monto: x.precio.toFixed(4), moneda: v.moneda },
            subtotal: { monto: (x.precio * x.cantidad).toFixed(4), moneda: v.moneda },
            costoUnitarioUsd: usd(x.costo),
            seriales,
          };
        });
        const nueva: Registro = {
          ...documento,
          estado: "ACTIVA",
          fecha: v.fecha,
          moneda: v.moneda,
          cliente: v.clienteVista,
          direccion: c.direccion ?? (v.clienteVista.id ? "Dirección del cliente" : ""),
          descripcion: c.descripcion,
          tecnicos: [{ id: USUARIO.id, nombre: USUARIO.nombre }],
          tasas: tasasCompra(),
          lineas,
          resumen: v.resumen,
          garantias: v.garantias,
          fotos: { antes: [], durante: [], despues: [] },
          total: { monto: desdeUsd(v.totalUsd, v.moneda).toFixed(4), moneda: v.moneda },
          utilidad: usd(v.totalUsd - v.costoUsd),
          porcentajeUtilidad: v.resumen.porcentajeUtilidad,
          monedasComprobante: c.monedasComprobante ?? [],
          registradaPor: USUARIO.nombre,
          registradaEn: new Date().toISOString(),
          version: 0,
        };
        Object.assign(nueva, convertir(c, documento));
        estado.instalaciones.push(nueva);
        estado.claves.set(clave, nueva);
        return json(route, 201, nueva);
      }
      case "GET /instalaciones/{id}": {
        const i = porId(estado.instalaciones);
        return i ? json(route, 200, i) : problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
      }
      case "GET /instalaciones":
        return json(route, 200, {
          desde: HOY,
          hasta: HOY,
          totalesPorMoneda: [],
          instalaciones: pagina(
            [...estado.instalaciones].reverse().map((i) => ({
              ...i,
              cliente: (i.cliente as { nombre?: string } | undefined)?.nombre,
              tecnicos: USUARIO.nombre,
              estadoGarantia: "VIGENTE",
            })),
          ),
        });
      case "POST /instalaciones/{id}/anular": {
        const i = estado.instalaciones.find((r) => ruta.includes(`/${String(r.id)}/`));
        if (!i) return problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
        const documento = { tipo: "INSTALACION", id: i.id, consecutivo: String(i.consecutivo) };
        for (const l of i.lineas as {
          productoId: number;
          cantidad: string;
          seriales: { numero: string }[];
        }[]) {
          const p = estado.productos.find((r) => r.id === l.productoId);
          if (p) moverStock(p, documento, Number(l.cantidad));
          for (const { numero } of l.seriales) {
            const s = estado.seriales.find((r) => r.productoId === l.productoId && r.numero === numero);
            if (s) {
              s.estado = "EN_BODEGA";
              delete s.documentoSalida;
            }
          }
        }
        revertir(i);
        Object.assign(i, {
          estado: "ANULADA",
          anulacion: { motivo: cuerpo().motivo, usuario: USUARIO.nombre, fecha: new Date().toISOString() },
        });
        return json(route, 200, i);
      }
      case "POST /instalaciones/{id}/fotos": {
        const i = estado.instalaciones.find((r) => ruta.includes(`/${String(r.id)}/`));
        if (!i) return problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
        const grupo = (url.searchParams.get("grupo") ?? "ANTES").toLowerCase() as
          "antes" | "durante" | "despues";
        const fotos = i.fotos as Record<string, { id: number; url: string }[]>;
        const fotoId = estado.id++;
        fotos[grupo]?.push({ id: fotoId, url: fotoSvg(`${grupo}-${String(fotoId)}`) });
        return json(route, 200, i);
      }
      case "DELETE /instalaciones/{id}/fotos/{id}": {
        const i = estado.instalaciones.find((r) => ruta.includes(`/${String(r.id)}/`));
        if (!i) return problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
        const fotoId = Number(ruta.split("/").pop());
        const fotos = i.fotos as Record<string, { id: number; url: string }[]>;
        for (const g of Object.keys(fotos)) fotos[g] = (fotos[g] ?? []).filter((f) => f.id !== fotoId);
        return json(route, 200, i);
      }
      case "POST /instalaciones/{id}/enlace":
        return json(route, 200, {
          url: `${API}/comprobantes/e2e`,
          whatsappUrl: "https://wa.me/573001234567?text=Comprobante",
          venceEn: new Date().toISOString(),
        });
      case "GET /garantias": {
        const filtroSerial = (url.searchParams.get("serial") ?? "").toUpperCase();
        const garantias = [
          ...estado.instalaciones.map((i) => ({
            clase: "MANO_OBRA",
            tipo: "INSTALACION",
            estado: "VIGENTE",
            vencimiento: (i.garantias as { venceManoObra: string }).venceManoObra,
            diasRestantes: 90,
            cliente: (i.cliente as { nombre?: string } | undefined)?.nombre,
            documento: { tipo: "INSTALACION", id: i.id, consecutivo: i.consecutivo },
          })),
          ...estado.seriales
            .filter((x) => x.documentoSalida)
            .map((x) => ({
              clase: "EQUIPO",
              tipo: x.documentoSalida?.tipo,
              estado: "VIGENTE",
              vencimiento: tresMeses(),
              diasRestantes: 90,
              producto: estado.productos.find((p) => p.id === x.productoId)?.nombre,
              serial: x.numero,
              serialId: x.id,
              documento: x.documentoSalida,
            })),
        ].filter((g) => !filtroSerial || (g as { serial?: string }).serial?.includes(filtroSerial));
        return json(route, 200, pagina(garantias));
      }
      case "GET /garantias/reclamos":
        return json(route, 200, estado.reclamos);
      case "POST /garantias/reclamos": {
        const c = cuerpo();
        const serial = estado.seriales.find((x) => x.id === c.serialId);
        const reclamo = {
          id: estado.id++,
          fecha: c.fecha ?? HOY,
          problema: c.problema,
          solucion: c.solucion,
          enGarantia: true,
          serial: serial?.numero,
          serialId: serial?.id,
          instalacionId: c.instalacionId,
          registradoPor: USUARIO.nombre,
          registradoEn: new Date().toISOString(),
          version: 0,
        };
        estado.reclamos.push(reclamo);
        return json(route, 201, reclamo);
      }
      case "GET /ventas/{id}/comprobante":
        return route.fulfill({
          status: 200,
          contentType: "application/pdf",
          headers: { ...CORS, "Content-Disposition": 'attachment; filename="V-0001.pdf"' },
          body: "%PDF-1.4 e2e",
        });
      case "POST /ventas/{id}/enlace":
        return json(route, 200, {
          url: `${API}/comprobantes/e2e`,
          whatsappUrl: "https://wa.me/573001234567?text=Comprobante",
          venceEn: new Date().toISOString(),
        });
      case "POST /cotizaciones/vista-previa": {
        const c = cuerpo();
        const v = calcularCotizacion(c);
        const dias = Number(c.validezDias ?? 15);
        return json(route, 200, {
          tipo: c.tipo,
          fecha: HOY,
          vence: vence(dias),
          validezDias: dias,
          moneda: v.moneda,
          cliente: v.clienteVista,
          tasas: tasasCompra(),
          avisos: [],
          lineas: lineasPrevia(v),
          resumen: v.resumen,
        });
      }
      case "POST /cotizaciones": {
        const clave = (await peticion.headerValue("idempotency-key")) ?? "";
        const repetida = estado.claves.get(clave);
        if (repetida) return json(route, 201, repetida);
        const id = estado.id++;
        const nueva: Registro = {
          ...vistaCotizacion(cuerpo(), {}),
          id,
          consecutivo: `COT-${String(estado.cotizaciones.length + 1).padStart(4, "0")}`,
          numero: estado.cotizaciones.length + 1,
          numeroVersion: 1,
          estado: "BORRADOR",
          versionesAnteriores: [],
          registradaPor: USUARIO.nombre,
          registradaEn: new Date().toISOString(),
          version: 0,
        };
        estado.cotizaciones.push(nueva);
        estado.claves.set(clave, nueva);
        return json(route, 201, nueva);
      }
      case "GET /cotizaciones":
        return json(
          route,
          200,
          pagina(
            [...estado.cotizaciones]
              .reverse()
              .filter((r) => !url.searchParams.get("estado") || r.estado === url.searchParams.get("estado"))
              .map((r) => ({
                ...r,
                cliente: (r.cliente as { nombre?: string } | undefined)?.nombre,
                documentoGenerado: (r.documentoGenerado as { consecutivo?: string } | undefined)?.consecutivo,
              })),
          ),
        );
      case "GET /cotizaciones/{id}": {
        const r = porId(estado.cotizaciones);
        return r ? json(route, 200, r) : problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
      }
      case "PUT /cotizaciones/{id}": {
        const r = porId(estado.cotizaciones);
        if (!r) return problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
        const c = cuerpo();
        const enEvaluacion = r.estado === "EN_EVALUACION";
        const numeroVersion = Number(r.numeroVersion) + (enEvaluacion ? 1 : 0);
        const anteriores = (r.versionesAnteriores as unknown[] | undefined) ?? [];
        Object.assign(r, vistaCotizacion(c, {}), {
          numeroVersion,
          consecutivo: `COT-${String(r.numero).padStart(4, "0")}${numeroVersion > 1 ? ` v${String(numeroVersion)}` : ""}`,
          versionesAnteriores: enEvaluacion
            ? [
                ...anteriores,
                {
                  numeroVersion: numeroVersion - 1,
                  fecha: HOY,
                  reemplazadaEn: new Date().toISOString(),
                  reemplazadaPor: USUARIO.nombre,
                  total: r.total,
                  lineas: r.lineas,
                },
              ]
            : anteriores,
          version: Number(r.version) + 1,
        });
        return json(route, 200, r);
      }
      case "POST /cotizaciones/{id}/enlace":
      case "POST /cotizaciones/{id}/enviar":
      case "POST /cotizaciones/{id}/aprobar":
      case "POST /cotizaciones/{id}/rechazar": {
        const r = estado.cotizaciones.find((x) => ruta.includes(`/${String(x.id)}/`));
        if (!r) return problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
        const accion = ruta.split("/").pop();
        const abierta = r.estado === "BORRADOR" || r.estado === "EN_EVALUACION";
        const permitida =
          accion === "rechazar" ? abierta || r.estado === "APROBADA" : accion === "enlace" || abierta;
        if (!permitida) {
          return problema(route, 422, "TRANSICION_NO_PERMITIDA", "La cotización no admite esa acción.");
        }
        const ahora = new Date().toISOString();
        if ((accion === "enlace" || accion === "enviar") && r.estado === "BORRADOR") {
          Object.assign(r, { estado: "EN_EVALUACION", enviadaEn: ahora });
        }
        if (accion === "aprobar") Object.assign(r, { estado: "APROBADA", aprobadaEn: ahora });
        if (accion === "rechazar")
          Object.assign(r, { estado: "RECHAZADA", rechazo: { ...cuerpo(), fecha: ahora } });
        if (accion === "enlace") {
          return json(route, 200, {
            estado: r.estado,
            url: `${API}/comprobantes/e2e`,
            whatsappUrl: "https://wa.me/573001234567?text=Cotizacion",
            venceEn: ahora,
          });
        }
        return json(route, 200, r);
      }
      case "POST /cotizaciones/{id}/duplicar": {
        const r = estado.cotizaciones.find((x) => ruta.includes(`/${String(x.id)}/`));
        if (!r) return problema(route, 404, "RECURSO_NO_ENCONTRADO", "No existe.");
        const id = estado.id++;
        const numero = estado.cotizaciones.length + 1;
        const copia: Registro = {
          ...vistaCotizacion(r.solicitud as Record<string, unknown>, {}),
          id,
          numero,
          consecutivo: `COT-${String(numero).padStart(4, "0")}`,
          numeroVersion: 1,
          estado: "BORRADOR",
          versionesAnteriores: [],
          registradaPor: USUARIO.nombre,
          registradaEn: new Date().toISOString(),
          version: 0,
        };
        estado.cotizaciones.push(copia);
        return json(route, 201, copia);
      }
      case "GET /cotizaciones/{id}/seguimiento":
        return json(route, 200, {
          mensaje: "Hola, ¿pudiste revisar la cotización?",
          whatsappUrl: "https://wa.me/573001234567?text=Seguimiento",
        });
      case "GET /cotizaciones/{id}/conversion": {
        const r = estado.cotizaciones.find((x) => ruta.includes(`/${String(x.id)}/`));
        if (r?.estado !== "APROBADA") {
          return problema(route, 422, "COTIZACION_NO_CONVERTIBLE", "La cotización no está aprobada.");
        }
        const c = r.solicitud as Record<string, unknown>;
        const v = calcularCotizacion(c);
        return json(route, 200, {
          cotizacionId: r.id,
          consecutivo: r.consecutivo,
          tipo: r.tipo,
          clienteId: c.clienteId,
          cliente: v.clienteVista.nombre,
          direccion: "Calle 10 # 5-20",
          descripcion: c.descripcion,
          moneda: v.moneda,
          manoDeObra: c.manoDeObra ?? "0",
          lineas: v.lineas.map((x) => ({
            productoId: x.p.id,
            nombre: x.p.nombre,
            codigo: x.p.codigo,
            abreviatura: unidadDe(x.p),
            controlaSerial: x.p.controlaSerial,
            cantidad: cantidadTexto(x.cantidad),
            precioUnitario: x.precio.toFixed(4),
            disponible: cantidadTexto(stockDe(x.p)),
          })),
          monedasComprobante: c.monedasComprobante ?? [],
          avisos: [],
          puedeGuardar: v.lineas.every((x) => x.cantidad <= stockDe(x.p)),
        });
      }
      case "GET /cotizaciones/{id}/comprobante":
        return route.fulfill({
          status: 200,
          contentType: "application/pdf",
          headers: { ...CORS, "Content-Disposition": 'attachment; filename="COT-0001.pdf"' },
          body: "%PDF-1.4 e2e",
        });
      case "GET /inicio": {
        // Inicio simulado (Fase 6): indicadores del mes con las ventas e instalaciones registradas.
        const activas = (lista: Registro[]) => lista.filter((r) => r.estado !== "ANULADA");
        const totalUsd = (lista: Registro[]) =>
          activas(lista).reduce(
            (t, r) =>
              t + Number((r.resumen as { total?: { usd?: Dinero } } | undefined)?.total?.usd?.monto ?? 0),
            0,
          );
        const utilidadUsd = [...activas(estado.ventas), ...activas(estado.instalaciones)].reduce(
          (t, r) => t + Number((r.utilidad as Dinero | undefined)?.monto ?? 0),
          0,
        );
        const bajos = estado.productos.filter((p) => Number(p.stockMinimo ?? 0) > stockDe(p));
        const valor = estado.productos.reduce((t, p) => t + (costoDe(p) ?? 0) * stockDe(p), 0);
        const movimientos = [
          ...estado.ventas.map((r) => ({ r, tipo: "VENTA" })),
          ...estado.instalaciones.map((r) => ({ r, tipo: "INSTALACION" })),
          ...estado.compras.map((r) => ({ r, tipo: "COMPRA" })),
        ]
          .reverse()
          .slice(0, 10)
          .map(({ r, tipo }) => ({
            tipo,
            id: r.id,
            consecutivo: r.consecutivo,
            detalle:
              (r.cliente as { nombre?: string } | undefined)?.nombre ??
              (r.proveedor as { nombre?: string } | undefined)?.nombre,
            usuario: USUARIO.nombre,
            registradoEn: r.registradaEn ?? new Date().toISOString(),
            valor: r.total,
            anulado: r.estado === "ANULADA",
          }));
        const enEvaluacion = estado.cotizaciones.filter((r) => r.estado === "EN_EVALUACION");
        return json(route, 200, {
          usuario: USUARIO.nombre,
          hoy: HOY,
          avisosTasas:
            estado.bolivar.fecha === HOY
              ? []
              : [{ par: "USD_VES", mensaje: "No se ha registrado la tasa del bolívar de hoy." }],
          tasas: vigentes(),
          indicadores: {
            ventas: {
              cantidad: activas(estado.ventas).length,
              total: enMonedas(totalUsd(estado.ventas)),
              porMoneda: [],
            },
            instalaciones: {
              cantidad: activas(estado.instalaciones).length,
              total: enMonedas(totalUsd(estado.instalaciones)),
              porMoneda: [],
            },
            utilidad: { total: enMonedas(utilidadUsd), porcentaje: "0" },
            inventario: {
              productos: estado.productos.filter((p) => stockDe(p) > 0).length,
              valor: enMonedas(valor),
              fecha: HOY,
            },
          },
          stockBajo: bajos.map((p) => ({
            productoId: p.id,
            codigo: p.codigo,
            nombre: p.nombre,
            unidad: unidadDe(p),
            stock: cantidadTexto(stockDe(p)),
            minimo: String(p.stockMinimo),
            nivel: String(Math.round((stockDe(p) / Number(p.stockMinimo)) * 100)),
          })),
          totalStockBajo: bajos.length,
          garantiasPorVencer: [],
          totalGarantiasPorVencer: 0,
          cotizacionesEnEvaluacion: enEvaluacion.map((r) => ({
            ...r,
            cliente: (r.cliente as { nombre?: string } | undefined)?.nombre,
          })),
          totalCotizacionesEnEvaluacion: enEvaluacion.length,
          ultimosMovimientos: movimientos,
        });
      }
      case "GET /reportes/periodo": {
        const tipo = url.searchParams.get("tipo") ?? "MES";
        const fecha = url.searchParams.get("fecha") ?? HOY;
        const [a, m] = fecha.split("-").map(Number);
        const inicioMes = (anio: number, mes: number) =>
          new Date(Date.UTC(anio, mes - 1, 1)).toISOString().slice(0, 10);
        const finMes = (anio: number, mes: number) =>
          new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10);
        const anio = a ?? 2026;
        const mes = m ?? 1;
        const total = (lista: Registro[]) =>
          lista
            .filter((r) => r.estado !== "ANULADA")
            .reduce(
              (t, r) =>
                t + Number((r.resumen as { total?: { usd?: Dinero } } | undefined)?.total?.usd?.monto ?? 0),
              0,
            );
        return json(route, 200, {
          tipo,
          desde: tipo === "ANIO" ? `${String(anio)}-01-01` : inicioMes(anio, mes),
          hasta: tipo === "ANIO" ? `${String(anio)}-12-31` : finMes(anio, mes),
          anterior:
            tipo === "ANIO"
              ? { desde: `${String(anio - 1)}-01-01`, hasta: `${String(anio - 1)}-12-31` }
              : {
                  desde: inicioMes(mes === 1 ? anio - 1 : anio, mes === 1 ? 12 : mes - 1),
                  hasta: finMes(mes === 1 ? anio - 1 : anio, mes === 1 ? 12 : mes - 1),
                },
          siguiente:
            tipo === "ANIO"
              ? { desde: `${String(anio + 1)}-01-01`, hasta: `${String(anio + 1)}-12-31` }
              : {
                  desde: inicioMes(mes === 12 ? anio + 1 : anio, mes === 12 ? 1 : mes + 1),
                  hasta: finMes(mes === 12 ? anio + 1 : anio, mes === 12 ? 1 : mes + 1),
                },
          agrupacion: tipo === "ANIO" ? "MES" : "SEMANA",
          indicadores: {
            ventas: { cantidad: estado.ventas.length, total: enMonedas(total(estado.ventas)), porMoneda: [] },
            instalaciones: {
              cantidad: estado.instalaciones.length,
              total: enMonedas(total(estado.instalaciones)),
              porMoneda: [],
            },
            utilidad: { total: enMonedas(0), porcentaje: "0" },
            inventario: { productos: estado.productos.length, valor: enMonedas(0), fecha: HOY },
          },
          serie: [
            {
              etiqueta: "Semana 1",
              desde: inicioMes(anio, mes),
              hasta: inicioMes(anio, mes),
              ventas: estado.ventas.length,
              totalVentas: usd(total(estado.ventas)),
              instalaciones: estado.instalaciones.length,
              totalInstalaciones: usd(total(estado.instalaciones)),
            },
          ],
          masVendidos: [],
          masInstalados: [],
          comprasPorProveedor: [],
          totalCompras: usd(0),
          stockBajo: [],
          cotizaciones: { total: estado.cotizaciones.length, porEstado: [], porcentajeAprobadas: "0" },
        });
      }
      case "GET /reportes/utilidad":
        return json(route, 200, {
          documentos: pagina([]),
          totalUsd: usd(0),
          costoUsd: usd(0),
          utilidadUsd: usd(0),
        });
      case "GET /reportes/seriales":
        return json(route, 200, {
          porEstado: [
            { estado: "EN_BODEGA", cantidad: estado.seriales.filter((x) => x.estado === "EN_BODEGA").length },
          ],
          seriales: pagina(estado.seriales.map(serialVista)),
        });
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
