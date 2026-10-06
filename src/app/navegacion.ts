import {
  ChartColumn,
  FileText,
  House,
  KeyRound,
  type LucideIcon,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";

/** Textos y destinos del menú (RF-01 a RF-04, W-01). Los íconos son los del prototipo (Lucide). */
export interface OpcionNavegacion {
  ruta: string;
  etiqueta: string;
  icono: LucideIcon;
}

/** Menú lateral en computador (RF-01). */
export const MENU_LATERAL: readonly OpcionNavegacion[] = [
  { ruta: "/", etiqueta: "Inicio", icono: House },
  { ruta: "/inventario", etiqueta: "Inventario", icono: Package },
  { ruta: "/ventas/nueva", etiqueta: "Nueva venta", icono: ShoppingCart },
  { ruta: "/instalaciones/nueva", etiqueta: "Nueva instalación", icono: Wrench },
  { ruta: "/compras", etiqueta: "Compras", icono: Truck },
  { ruta: "/cotizaciones", etiqueta: "Cotizaciones", icono: FileText },
  { ruta: "/clientes", etiqueta: "Clientes", icono: Users },
  { ruta: "/reportes", etiqueta: "Reportes", icono: ChartColumn },
];

/** Barra inferior en celular (RF-03); el botón Nuevo (+) va en el centro. */
export const BARRA_INFERIOR_IZQUIERDA: readonly OpcionNavegacion[] = [
  { ruta: "/", etiqueta: "Inicio", icono: House },
  { ruta: "/inventario", etiqueta: "Inventario", icono: Package },
];
export const BARRA_INFERIOR_DERECHA: readonly OpcionNavegacion[] = [
  { ruta: "/clientes", etiqueta: "Clientes", icono: Users },
  { ruta: "/reportes", etiqueta: "Reportes", icono: ChartColumn },
];

/** Opciones del botón Nuevo (+) del celular (RF-04). */
export const MENU_NUEVO: readonly OpcionNavegacion[] = [
  { ruta: "/ventas/nueva", etiqueta: "Nueva venta", icono: ShoppingCart },
  { ruta: "/instalaciones/nueva", etiqueta: "Nueva instalación", icono: Wrench },
  { ruta: "/compras/nueva", etiqueta: "Registrar compra", icono: Truck },
  { ruta: "/cotizaciones/nueva", etiqueta: "Nueva cotización", icono: FileText },
];

/** Menú del usuario (RU-05, RU-07 y W-01: Configuración y Usuarios van aquí). */
export const MENU_USUARIO: readonly OpcionNavegacion[] = [
  { ruta: "/configuracion", etiqueta: "Configuración", icono: Settings },
  { ruta: "/usuarios", etiqueta: "Usuarios", icono: UserCog },
  { ruta: "/cuenta/contrasena", etiqueta: "Cambiar contraseña", icono: KeyRound },
];

export const TEXTOS_NAVEGACION = {
  marcaSubtitulo: "Control interno",
  nuevo: "Nuevo",
  registrar: "Registrar",
  menuPrincipal: "Menú principal",
  menuUsuario: "Menú de tu cuenta",
  cerrarSesion: "Cerrar sesión",
  sinConexion: "Sin conexión a internet. Los cambios no se guardarán hasta que vuelva la conexión.",
  nuevaVersion: "Hay una versión nueva de ITALARM",
  actualizar: "Actualizar",
} as const;
