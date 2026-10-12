import type { components } from "@/api/esquema";

type S = components["schemas"];

/** Datos de prueba que cumplen el contrato. Cada función acepta cambios puntuales. */

export const HOY = "2026-10-06";

export function tasaVigente(cambios: Partial<S["TasaVigenteVista"]> = {}): S["TasaVigenteVista"] {
  return {
    id: 1,
    par: "USD_COP",
    valor: "3912.450000",
    fecha: HOY,
    fuente: "SUPERFINANCIERA",
    registradaEn: "2026-10-06T11:00:00Z",
    registradaPor: "Sistema",
    esDeHoy: true,
    ...cambios,
  };
}

export function tasasVigentes(cambios: Partial<S["TasasVigentesVista"]> = {}): S["TasasVigentesVista"] {
  return {
    hoy: HOY,
    trmAutomaticaFallo: false,
    trm: tasaVigente(),
    bolivar: tasaVigente({
      id: 2,
      par: "USD_VES",
      valor: "50.000000",
      fuente: "MANUAL",
      registradaPor: "Jose Ochoa",
      registradaEn: "2026-10-06T13:15:00Z",
    }),
    ...cambios,
  };
}

export function configuracion(cambios: Partial<S["ConfiguracionVista"]> = {}): S["ConfiguracionVista"] {
  return {
    empresaNombre: "ITALARM",
    empresaLema: "Seguridad que se ve",
    empresaNit: "900123456-7",
    empresaCiudad: "Cúcuta",
    empresaTelefono: "+573001234567",
    empresaCorreo: "contacto@italarm.test",
    validezCotizacionDias: 15,
    garantiaManoObraMeses: 3,
    garantiaEquiposMeses: 3,
    condicionesGarantia: "La garantía no cubre daños por mal uso.",
    piePdf: "Gracias por su compra.",
    limiteVariacionTasa: "5.00",
    version: 3,
    ...cambios,
  };
}

export function pagina<T>(
  contenido: T[],
  tamano = 20,
): {
  contenido: T[];
  pagina: number;
  tamano: number;
  totalElementos: number;
  totalPaginas: number;
} {
  return {
    contenido,
    pagina: 0,
    tamano,
    totalElementos: contenido.length,
    totalPaginas: contenido.length ? 1 : 0,
  };
}

export const CATEGORIAS: S["CategoriaVista"][] = [
  { id: 1, nombre: "Cámaras", cantidadProductos: 3, version: 0 },
  { id: 2, nombre: "Cable", cantidadProductos: 0, version: 0 },
];

export const UNIDADES: S["UnidadMedidaVista"][] = [
  { id: 1, nombre: "Unidad", abreviatura: "und", admiteDecimales: false, version: 0 },
  { id: 2, nombre: "Metro", abreviatura: "m", admiteDecimales: true, version: 0 },
];

export const USUARIOS: S["UsuarioVista"][] = [
  { id: 1, nombre: "Jose Ochoa", correo: "jose@italarm.test", activo: true, version: 0 },
  { id: 2, nombre: "Victor", correo: "victor@italarm.test", activo: true, version: 0 },
  { id: 3, nombre: "Ayudante", correo: "ayudante@italarm.test", activo: false, version: 1 },
];

export function producto(cambios: Partial<S["ProductoVista"]> = {}): S["ProductoVista"] {
  return {
    id: 10,
    codigo: "CAM-D2",
    nombre: "Cámara domo 2MP",
    marca: "Hikvision",
    modelo: "DS-2CE56D0T",
    categoria: { id: 1, nombre: "Cámaras" },
    unidadMedida: { id: 1, nombre: "Unidad", abreviatura: "und", admiteDecimales: false, version: 0 },
    controlaSerial: true,
    precioInstalador: { monto: "25.5000", moneda: "USD" },
    precioClienteFinal: { monto: "32.0000", moneda: "USD" },
    stockMinimo: "5",
    stock: "0",
    bajoMinimo: true,
    activo: true,
    descripcion: "Cámara para interiores",
    version: 2,
    ...cambios,
  };
}

export function cliente(cambios: Partial<S["ClienteVista"]> = {}): S["ClienteVista"] {
  return {
    id: 20,
    tipo: "INSTALADOR",
    nombre: "Ferretería El Tornillo",
    tipoDocumento: "NIT",
    numeroDocumento: "900111222-3",
    telefono: "+573001234567",
    correo: "tornillo@correo.test",
    direccion: "Calle 10 # 5-20",
    ciudad: "Cúcuta",
    precioAplicado: "INSTALADOR",
    precioAplicadoDescripcion: "Se le aplicará el precio instalador",
    cantidadMovimientos: 2,
    fechaUltimoMovimiento: "2026-10-01",
    version: 1,
    ...cambios,
  };
}

export function proveedor(cambios: Partial<S["ProveedorVista"]> = {}): S["ProveedorVista"] {
  return {
    id: 30,
    nombre: "Distribuidora Seguridad Total",
    nit: "800555444-1",
    telefono: "+573109998877",
    correo: "ventas@seguridadtotal.test",
    ciudad: "Bogotá",
    monedaHabitual: "COP",
    version: 0,
    ...cambios,
  };
}

export function productoInventario(
  cambios: Partial<S["InventarioVistaProducto"]> = {},
): S["InventarioVistaProducto"] {
  return {
    id: 10,
    codigo: "CAM-D2",
    nombre: "Cámara domo 2MP",
    marca: "Hikvision",
    categoria: "Cámaras",
    abreviatura: "und",
    controlaSerial: true,
    stock: "4",
    stockMinimo: "5",
    bajoMinimo: true,
    activo: true,
    costoActualUsd: { monto: "20.0000", moneda: "USD" },
    valorEnBodega: {
      usd: { monto: "80.0000", moneda: "USD" },
      cop: { monto: "320000.0000", moneda: "COP" },
      ves: { monto: "4000.0000", moneda: "VES" },
    },
    ...cambios,
  };
}

export function productoDetalle(
  cambios: Partial<S["ProductoInventarioVista"]> = {},
): S["ProductoInventarioVista"] {
  return {
    id: 10,
    codigo: "CAM-D2",
    nombre: "Cámara domo 2MP",
    marca: "Hikvision",
    modelo: "DS-2CE56D0T",
    categoria: "Cámaras",
    abreviatura: "und",
    controlaSerial: true,
    stock: "4",
    stockMinimo: "5",
    bajoMinimo: true,
    activo: true,
    avisos: [],
    costoActual: {
      usd: { monto: "20.0000", moneda: "USD" },
      cop: { monto: "80000.0000", moneda: "COP" },
    },
    valorEnBodega: { usd: { monto: "80.0000", moneda: "USD" } },
    precioInstalador: { usd: { monto: "25.5000", moneda: "USD" } },
    precioClienteFinal: { usd: { monto: "32.0000", moneda: "USD" } },
    seriales: { enBodega: 4, vendidos: 1, instalados: 0, dadosDeBaja: 0, anulados: 0 },
    ...cambios,
  };
}

export function serial(cambios: Partial<S["SerialVista"]> = {}): S["SerialVista"] {
  return {
    id: 500,
    numero: "SN-0001",
    estado: "EN_BODEGA",
    fechaEntrada: "2026-10-01",
    producto: { id: 10, codigo: "CAM-D2", nombre: "Cámara domo 2MP" },
    documentoEntrada: { tipo: "COMPRA", id: 40, consecutivo: "COM-0001" },
    ...cambios,
  };
}

/** El backend omite los campos vacíos; con exactOptionalPropertyTypes no se pueden poner en undefined. */
export function sinCampos<T extends object>(objeto: T, ...campos: (keyof T & string)[]): T {
  return Object.fromEntries(
    Object.entries(objeto).filter(([clave]) => !(campos as string[]).includes(clave)),
  ) as T;
}

export function compra(cambios: Partial<S["CompraVista"]> = {}): S["CompraVista"] {
  return {
    id: 40,
    consecutivo: "C-0001",
    estado: "ACTIVA",
    proveedor: { id: 30, nombre: "Distribuidora Seguridad Total" },
    numeroFactura: "FE-123",
    fecha: "2026-10-01",
    moneda: "COP",
    tasas: { trm: "4000", fechaTrm: "2026-10-01", tasaVes: "50", fechaTasaVes: "2026-10-01" },
    registradaPor: "Jose Ochoa",
    registradaEn: "2026-10-01T15:30:00Z",
    total: { monto: "400000.0000", moneda: "COP" },
    totalUsd: { monto: "100.0000", moneda: "USD" },
    anulable: true,
    lineas: [
      {
        productoId: 10,
        codigo: "CAM-D2",
        nombre: "Cámara domo 2MP",
        abreviatura: "und",
        cantidad: "5",
        costoUnitario: { monto: "80000.0000", moneda: "COP" },
        costoUnitarioUsd: { monto: "20.0000", moneda: "USD" },
        subtotal: { monto: "400000.0000", moneda: "COP" },
        costoNuevoUsd: { monto: "20.0000", moneda: "USD" },
        regla: "SIN_STOCK",
        seriales: ["SN-1", "SN-2", "SN-3", "SN-4", "SN-5"],
      },
    ],
    ...cambios,
  };
}

const usd = (monto: string) => ({ monto, moneda: "USD" as const });
const cop = (monto: string) => ({ monto, moneda: "COP" as const });

export function venta(cambios: Partial<S["VentaVista"]> = {}): S["VentaVista"] {
  return {
    id: 60,
    consecutivo: "V-0001",
    estado: "ACTIVA",
    fecha: "2026-10-06",
    moneda: "USD",
    cliente: {
      id: 20,
      tipo: "INSTALADOR",
      nombre: "Ferretería El Tornillo",
      documento: "NIT 900111222-3",
      telefono: "+573001234567",
      direccion: "Calle 10 # 5-20",
      ciudad: "Cúcuta",
    },
    tasas: { trm: "4000", fechaTrm: "2026-10-06", tasaVes: "50", fechaTasaVes: "2026-10-06" },
    lineas: [
      {
        productoId: 10,
        codigo: "CAM-D2",
        descripcion: "Cámara domo 2MP",
        unidad: "und",
        cantidad: "1",
        precioSugerido: usd("25.5000"),
        precioUnitario: usd("25.5000"),
        subtotal: usd("25.5000"),
        costoUnitarioUsd: usd("17.5000"),
        seriales: [{ id: 500, numero: "SN-0001", vencimientoGarantia: "2027-01-06" }],
      },
    ],
    resumen: {
      material: { usd: usd("25.5000") },
      subtotal: { usd: usd("25.5000"), cop: cop("102000.0000") },
      descuento: { usd: usd("0.0000") },
      total: { usd: usd("25.5000"), cop: cop("102000.0000") },
      costo: { usd: usd("17.5000") },
      utilidad: { usd: usd("8.0000") },
      porcentajeUtilidad: "31.37",
    },
    total: usd("25.5000"),
    utilidad: usd("8.0000"),
    porcentajeUtilidad: "31.37",
    monedasComprobante: [],
    registradaPor: "Jose Ochoa",
    registradaEn: "2026-10-06T15:00:00Z",
    version: 0,
    ...cambios,
  };
}

/** Vista previa de una venta: responde a las líneas pedidas con precio, disponible y resumen. */
export function vistaPreviaVenta(
  cuerpo: {
    moneda: "USD" | "COP" | "VES";
    lineas: { productoId: number; cantidad?: string; seriales?: string[]; precioUnitario?: string }[];
  },
  cambios: Partial<S["VistaPreviaVentaVista"]> = {},
): S["VistaPreviaVentaVista"] {
  return {
    fecha: HOY,
    moneda: cuerpo.moneda,
    cliente: {
      id: 20,
      tipo: "INSTALADOR",
      nombre: "Ferretería El Tornillo",
      precioAplicado: "Se le aplicará el precio instalador",
    },
    tasas: { trm: "4000", fechaTrm: HOY, tasaVes: "50", fechaTasaVes: HOY },
    avisos: [],
    puedeGuardar: true,
    lineas: cuerpo.lineas.map((l) => ({
      productoId: l.productoId,
      nombre: l.productoId === 10 ? "Cámara domo 2MP" : "Cable UTP",
      abreviatura: l.productoId === 10 ? "und" : "m",
      cantidad: l.cantidad ?? String(l.seriales?.length ?? 0),
      disponible: "4",
      precioSugerido: { monto: "25.5000", moneda: cuerpo.moneda },
      precioUnitario: { monto: l.precioUnitario ?? "25.5000", moneda: cuerpo.moneda },
      subtotal: { usd: usd("25.5000"), cop: cop("102000.0000") },
      costoUnitarioHoy: { usd: usd("17.5000"), cop: cop("70000.0000") },
      costoUnitarioUltimaCompra: { usd: usd("17.5000"), cop: cop("68000.0000") },
      ultimaCompra: { consecutivo: "C-0001", fecha: "2026-10-01", trm: "3885.7143" },
    })),
    resumen: {
      subtotal: { usd: usd("100.0000") },
      descuento: { usd: usd("7.0000") },
      total: { usd: usd("93.0000"), cop: cop("372000.0000") },
      costo: { usd: usd("70.0000") },
      utilidad: { usd: usd("23.0000") },
      porcentajeUtilidad: "24.73",
    },
    ...cambios,
  };
}

export function instalacion(cambios: Partial<S["InstalacionVista"]> = {}): S["InstalacionVista"] {
  return {
    id: 80,
    consecutivo: "I-0001",
    estado: "ACTIVA",
    fecha: "2026-10-01",
    moneda: "USD",
    cliente: {
      id: 20,
      tipo: "INSTALADOR",
      nombre: "Ferretería El Tornillo",
      documento: "NIT 900111222-3",
      telefono: "+573001234567",
      direccion: "Calle 10 # 5-20",
      ciudad: "Cúcuta",
    },
    direccion: "Carrera 5 # 1-10",
    descripcion: "Instalación de 2 cámaras",
    tecnicos: [{ id: 1, nombre: "Jose Ochoa" }],
    tasas: { trm: "4000", fechaTrm: "2026-10-01", tasaVes: "50", fechaTasaVes: "2026-10-01" },
    lineas: [
      {
        productoId: 10,
        codigo: "CAM-D2",
        descripcion: "Cámara domo 2MP",
        unidad: "und",
        cantidad: "1",
        precioSugerido: usd("25.5000"),
        precioUnitario: usd("25.5000"),
        subtotal: usd("25.5000"),
        costoUnitarioUsd: usd("17.5000"),
        seriales: [{ id: 500, numero: "SN-0001", vencimientoGarantia: "2027-01-01" }],
      },
    ],
    resumen: {
      material: { usd: usd("25.5000") },
      manoDeObra: { usd: usd("40.0000") },
      subtotal: { usd: usd("65.5000") },
      descuento: { usd: usd("0.0000") },
      total: { usd: usd("65.5000"), cop: cop("262000.0000") },
      costo: { usd: usd("17.5000") },
      utilidad: { usd: usd("48.0000") },
      porcentajeUtilidad: "73.28",
    },
    garantias: {
      manoObraMeses: 3,
      venceManoObra: "2027-01-01",
      estadoManoObra: "VIGENTE",
      venceEquipos: "2027-01-01",
      estadoEquipos: "VIGENTE",
      condiciones: "La garantía no cubre daños por mal uso.",
    },
    fotos: {
      antes: [{ id: 1, url: "http://archivos.prueba/antes-1.webp" }],
      durante: [],
      despues: [],
    },
    total: usd("65.5000"),
    utilidad: usd("48.0000"),
    porcentajeUtilidad: "73.28",
    monedasComprobante: [],
    registradaPor: "Jose Ochoa",
    registradaEn: "2026-10-01T15:00:00Z",
    version: 0,
    ...cambios,
  };
}

export function cotizacion(cambios: Partial<S["CotizacionVista"]> = {}): S["CotizacionVista"] {
  return {
    id: 90,
    consecutivo: "COT-0001",
    numeroVersion: 1,
    tipo: "INSTALACION",
    estado: "BORRADOR",
    fecha: HOY,
    validezDias: 15,
    vence: "2026-10-21",
    diasParaVencer: 15,
    porVencer: false,
    moneda: "USD",
    cliente: {
      id: 20,
      tipo: "INSTALADOR",
      nombre: "Ferretería El Tornillo",
      documento: "NIT 900111222-3",
      telefono: "+573001234567",
      direccion: "Calle 10 # 5-20",
      ciudad: "Cúcuta",
    },
    descripcion: "Instalación de 4 cámaras",
    tasas: { trm: "4200", fechaTrm: HOY, tasaVes: "50", fechaTasaVes: HOY },
    lineas: [
      {
        productoId: 10,
        codigo: "CAM-D2",
        descripcion: "Cámara domo 2MP",
        unidad: "und",
        cantidad: "4",
        precioSugerido: usd("25.5000"),
        precioUnitario: usd("25.5000"),
        subtotal: usd("102.0000"),
        costoUnitarioUsd: usd("19.5000"),
      },
    ],
    resumen: {
      material: { usd: usd("102.0000") },
      manoDeObra: { usd: usd("40.0000") },
      subtotal: { usd: usd("142.0000") },
      descuento: { usd: usd("0.0000") },
      total: { usd: usd("142.0000"), cop: cop("596400.0000") },
      costo: { usd: usd("78.0000") },
      utilidad: { usd: usd("64.0000") },
      porcentajeUtilidad: "45.07",
    },
    total: usd("142.0000"),
    utilidad: usd("64.0000"),
    porcentajeUtilidad: "45.07",
    monedasComprobante: [],
    versionesAnteriores: [],
    registradaPor: "Jose Ochoa",
    registradaEn: "2026-10-06T15:00:00Z",
    version: 0,
    ...cambios,
  };
}

/** Vista previa de una cotización: precios, costo de US$ 19,50 a TRM 4.200 y 4.000 (CP-09) y resumen. */
export function vistaPreviaCotizacion(
  cuerpo: {
    tipo: "VENTA" | "INSTALACION";
    moneda: "USD" | "COP" | "VES";
    lineas?: { productoId: number; cantidad: string; precioUnitario?: string }[];
  },
  cambios: Partial<S["VistaPreviaCotizacionVista"]> = {},
): S["VistaPreviaCotizacionVista"] {
  return {
    tipo: cuerpo.tipo,
    fecha: HOY,
    vence: "2026-10-21",
    validezDias: 15,
    moneda: cuerpo.moneda,
    cliente: {
      id: 20,
      tipo: "INSTALADOR",
      nombre: "Ferretería El Tornillo",
      documento: "NIT 900111222-3",
      telefono: "+573001234567",
      precioAplicado: "Se le aplicará el precio instalador",
    },
    tasas: { trm: "4200", fechaTrm: HOY, tasaVes: "50", fechaTasaVes: HOY },
    avisos: [],
    lineas: (cuerpo.lineas ?? []).map((l) => ({
      productoId: l.productoId,
      nombre: l.productoId === 10 ? "Cámara domo 2MP" : "Cable UTP",
      abreviatura: l.productoId === 10 ? "und" : "m",
      cantidad: l.cantidad,
      disponible: "3",
      precioSugerido: { monto: "25.5000", moneda: cuerpo.moneda },
      precioUnitario: { monto: l.precioUnitario ?? "25.5000", moneda: cuerpo.moneda },
      subtotal: { usd: usd("102.0000"), cop: cop("428400.0000") },
      costoUnitarioHoy: { usd: usd("19.5000"), cop: cop("81900.0000") },
      costoUnitarioUltimaCompra: { usd: usd("19.5000"), cop: cop("78000.0000") },
      ultimaCompra: { consecutivo: "C-0001", fecha: "2026-10-01", trm: "4000" },
    })),
    resumen: {
      material: { usd: usd("102.0000") },
      manoDeObra: { usd: usd(cuerpo.tipo === "INSTALACION" ? "40.0000" : "0.0000") },
      subtotal: { usd: usd("142.0000") },
      descuento: { usd: usd("0.0000") },
      total: { usd: usd("142.0000"), cop: cop("596400.0000") },
      costo: { usd: usd("78.0000") },
      utilidad: { usd: usd("64.0000") },
      porcentajeUtilidad: "45.07",
    },
    ...cambios,
  };
}

/** Lo que devuelve GET /cotizaciones/{id}/conversion para la cotización aprobada de 4 cámaras y 120 m de cable. */
export function conversion(
  cambios: Partial<S["ConversionCotizacionVista"]> = {},
): S["ConversionCotizacionVista"] {
  return {
    cotizacionId: 90,
    consecutivo: "COT-0001",
    tipo: "INSTALACION",
    clienteId: 20,
    cliente: "Ferretería El Tornillo",
    direccion: "Carrera 5 # 1-10",
    descripcion: "Instalación de 4 cámaras",
    moneda: "USD",
    manoDeObra: "40.0000",
    lineas: [
      {
        productoId: 10,
        nombre: "Cámara domo 2MP",
        codigo: "CAM-D2",
        abreviatura: "und",
        controlaSerial: true,
        cantidad: "4",
        precioUnitario: "24.0000",
        disponible: "4",
      },
      {
        productoId: 11,
        nombre: "Cable UTP",
        codigo: "CAB-UTP",
        abreviatura: "m",
        controlaSerial: false,
        cantidad: "120",
        precioUnitario: "0.8000",
        disponible: "300",
      },
    ],
    monedasComprobante: ["COP"],
    avisos: [],
    puedeGuardar: true,
    ...cambios,
  };
}

/** Inicio vacío (un día sin movimientos): lo usa el menú en todas las pantallas. */
export function inicioVacio(cambios: Partial<S["InicioVista"]> = {}): S["InicioVista"] {
  return {
    usuario: "Jose Ochoa",
    hoy: HOY,
    avisosTasas: [],
    tasas: tasasVigentes(),
    indicadores: {
      ventas: { cantidad: 0, total: { usd: usd("0.0000") }, porMoneda: [] },
      instalaciones: { cantidad: 0, total: { usd: usd("0.0000") }, porMoneda: [] },
      utilidad: { total: { usd: usd("0.0000") }, porcentaje: "0" },
      inventario: { productos: 0, valor: { usd: usd("0.0000") }, fecha: HOY },
    },
    stockBajo: [],
    totalStockBajo: 0,
    garantiasPorVencer: [],
    totalGarantiasPorVencer: 0,
    cotizacionesEnEvaluacion: [],
    totalCotizacionesEnEvaluacion: 0,
    ultimosMovimientos: [],
    ...cambios,
  };
}

const enMonedas = (u: string, c: string, v: string) => ({
  usd: usd(u),
  cop: cop(c),
  ves: { monto: v, moneda: "VES" as const },
});

/** Indicadores de un mes con movimiento (Inicio y Reportes). */
export const INDICADORES: S["IndicadoresVista"] = {
  ventas: {
    cantidad: 23,
    total: enMonedas("2152.0000", "8608000.0000", "107600.0000"),
    porMoneda: [usd("1652.0000"), cop("2000000.0000")],
  },
  instalaciones: {
    cantidad: 6,
    total: enMonedas("2901.0000", "11604000.0000", "145050.0000"),
    porMoneda: [usd("2901.0000")],
  },
  utilidad: { total: enMonedas("1774.0000", "7096000.0000", "88700.0000"), porcentaje: "35.11" },
  inventario: { productos: 42, valor: enMonedas("15230.5000", "60922000.0000", "761525.0000"), fecha: HOY },
};

/** Inicio con todos sus bloques. */
export function inicio(cambios: Partial<S["InicioVista"]> = {}): S["InicioVista"] {
  return inicioVacio({
    indicadores: INDICADORES,
    stockBajo: [
      {
        productoId: 11,
        codigo: "CAB-UTP",
        nombre: "Cable UTP",
        unidad: "m",
        stock: "50",
        minimo: "200",
        nivel: "25",
      },
      {
        productoId: 10,
        codigo: "CAM-D2",
        nombre: "Cámara domo 2MP",
        unidad: "und",
        stock: "2",
        minimo: "5",
        nivel: "40",
      },
    ],
    totalStockBajo: 2,
    garantiasPorVencer: [
      {
        clase: "MANO_OBRA",
        cliente: "Ferretería El Tornillo",
        clienteId: 20,
        documento: { tipo: "INSTALACION", id: 80, consecutivo: "I-0001" },
        vencimiento: "2026-10-20",
        diasRestantes: 14,
        estado: "POR_VENCER",
      },
    ],
    totalGarantiasPorVencer: 1,
    cotizacionesEnEvaluacion: [
      {
        id: 90,
        consecutivo: "COT-0001",
        cliente: "Ana Gómez",
        estado: "EN_EVALUACION",
        total: usd("142.0000"),
        diasParaVencer: 2,
        porVencer: true,
      },
      {
        id: 91,
        consecutivo: "COT-0002",
        cliente: "Ferretería El Tornillo",
        estado: "EN_EVALUACION",
        total: usd("80.0000"),
        diasParaVencer: 10,
        porVencer: false,
      },
    ],
    totalCotizacionesEnEvaluacion: 2,
    ultimosMovimientos: [
      {
        tipo: "VENTA",
        id: 60,
        consecutivo: "V-0001",
        detalle: "Ferretería El Tornillo",
        usuario: "Jose Ochoa",
        registradoEn: "2026-10-06T15:00:00Z",
        valor: usd("25.5000"),
        anulado: false,
      },
      {
        tipo: "COMPRA",
        id: 40,
        consecutivo: "C-0001",
        detalle: "Distribuidora Andina",
        usuario: "Victor",
        registradoEn: "2026-10-05T14:00:00Z",
        valor: cop("1500000.0000"),
        anulado: true,
      },
    ],
    ...cambios,
  });
}

/** Reporte de octubre de 2026 (mes), con su serie por semanas. */
export function reportePeriodo(cambios: Partial<S["ReportePeriodoVista"]> = {}): S["ReportePeriodoVista"] {
  return {
    tipo: "MES",
    desde: "2026-10-01",
    hasta: "2026-10-31",
    anterior: { desde: "2026-09-01", hasta: "2026-09-30" },
    siguiente: { desde: "2026-11-01", hasta: "2026-11-30" },
    agrupacion: "SEMANA",
    indicadores: INDICADORES,
    serie: [
      {
        etiqueta: "1–4 oct",
        desde: "2026-10-01",
        hasta: "2026-10-04",
        ventas: 5,
        totalVentas: usd("500.0000"),
        instalaciones: 1,
        totalInstalaciones: usd("1000.0000"),
      },
      {
        etiqueta: "5–11 oct",
        desde: "2026-10-05",
        hasta: "2026-10-11",
        ventas: 18,
        totalVentas: usd("1652.0000"),
        instalaciones: 5,
        totalInstalaciones: usd("1901.0000"),
      },
    ],
    masVendidos: [
      {
        productoId: 10,
        codigo: "CAM-D2",
        nombre: "Cámara domo 2MP",
        cantidad: "40",
        unidad: "und",
        valor: usd("1020.0000"),
      },
      {
        productoId: 11,
        codigo: "CAB-UTP",
        nombre: "Cable UTP",
        cantidad: "850.5",
        unidad: "m",
        valor: usd("425.2500"),
      },
    ],
    masInstalados: [],
    comprasPorProveedor: [
      { proveedorId: 30, proveedor: "Distribuidora Andina", compras: 3, total: usd("3000.0000") },
      { proveedorId: 31, proveedor: "Importadora Norte", compras: 1, total: usd("750.0000") },
    ],
    totalCompras: usd("3750.0000"),
    stockBajo: [
      {
        productoId: 11,
        codigo: "CAB-UTP",
        nombre: "Cable UTP",
        unidad: "m",
        stock: "50",
        minimo: "200",
        nivel: "25",
      },
    ],
    cotizaciones: {
      total: 10,
      porcentajeAprobadas: "60.00",
      porEstado: [
        { estado: "APROBADA", cantidad: 2 },
        { estado: "CONVERTIDA", cantidad: 4 },
        { estado: "RECHAZADA", cantidad: 4 },
      ],
    },
    ...cambios,
  };
}
