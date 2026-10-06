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
