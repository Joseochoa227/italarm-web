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
