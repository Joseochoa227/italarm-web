import type { RouteObject } from "react-router";

import { RutaProtegida } from "@/features/auth/components/RutaProtegida";

import { ErrorRuta } from "./ErrorRuta";
import { Layout } from "./Layout";

/** Todas las pantallas se cargan de forma diferida para que la primera carga sea rápida (BF-12). */
export const rutas: RouteObject[] = [
  {
    errorElement: <ErrorRuta />,
    children: [
      { path: "/ingresar", lazy: () => import("@/features/auth/pages/PaginaIngreso") },
      {
        element: <RutaProtegida />,
        children: [
          {
            element: <Layout />,
            children: [
              { index: true, lazy: () => import("@/features/inicio/pages/PaginaInicio") },
              { path: "inventario", lazy: () => import("@/features/inventario/pages/PaginaInventario") },
              {
                path: "inventario/productos/nuevo",
                lazy: () => import("@/features/inventario/pages/PaginaNuevoProducto"),
              },
              {
                path: "inventario/productos/:id",
                lazy: () => import("@/features/inventario/pages/PaginaProducto"),
              },
              {
                path: "inventario/productos/:id/ajuste",
                lazy: () => import("@/features/inventario/pages/PaginaAjuste"),
              },
              { path: "inventario/ajustes", lazy: () => import("@/features/inventario/pages/PaginaAjustes") },
              {
                path: "inventario/ajustes/:id",
                lazy: () => import("@/features/inventario/pages/PaginaDetalleAjuste"),
              },
              {
                path: "inventario/productos/:id/editar",
                lazy: () => import("@/features/inventario/pages/PaginaEditarProducto"),
              },
              { path: "seriales/:id", lazy: () => import("@/features/inventario/pages/PaginaSerial") },
              { path: "ventas", lazy: () => import("@/features/ventas/pages/PaginaVentas") },
              { path: "ventas/nueva", lazy: () => import("@/features/ventas/pages/PaginaNuevaVenta") },
              { path: "ventas/:id", lazy: () => import("@/features/ventas/pages/PaginaVenta") },
              {
                path: "instalaciones",
                lazy: () => import("@/features/instalaciones/pages/PaginaInstalaciones"),
              },
              {
                path: "instalaciones/:id",
                lazy: () => import("@/features/instalaciones/pages/PaginaInstalacion"),
              },
              { path: "garantias", lazy: () => import("@/features/garantias/pages/PaginaGarantias") },
              {
                path: "instalaciones/nueva",
                lazy: () => import("@/features/instalaciones/pages/PaginaNuevaInstalacion"),
              },
              { path: "compras", lazy: () => import("@/features/compras/pages/PaginaCompras") },
              { path: "compras/nueva", lazy: () => import("@/features/compras/pages/PaginaNuevaCompra") },
              { path: "compras/:id", lazy: () => import("@/features/compras/pages/PaginaCompra") },
              {
                path: "compras/proveedores/nuevo",
                lazy: () => import("@/features/compras/pages/PaginaNuevoProveedor"),
              },
              {
                path: "compras/proveedores/:id/editar",
                lazy: () => import("@/features/compras/pages/PaginaEditarProveedor"),
              },
              {
                path: "cotizaciones",
                lazy: () => import("@/features/cotizaciones/pages/PaginaCotizaciones"),
              },
              {
                path: "cotizaciones/nueva",
                lazy: () => import("@/features/cotizaciones/pages/PaginaNuevaCotizacion"),
              },
              { path: "clientes", lazy: () => import("@/features/clientes/pages/PaginaClientes") },
              { path: "clientes/nuevo", lazy: () => import("@/features/clientes/pages/PaginaNuevoCliente") },
              { path: "clientes/:id", lazy: () => import("@/features/clientes/pages/PaginaCliente") },
              {
                path: "clientes/:id/editar",
                lazy: () => import("@/features/clientes/pages/PaginaEditarCliente"),
              },
              { path: "tasas", lazy: () => import("@/features/tasas/pages/PaginaTasas") },
              { path: "reportes", lazy: () => import("@/features/reportes/pages/PaginaReportes") },
              {
                path: "configuracion",
                lazy: () => import("@/features/configuracion/pages/PaginaConfiguracion"),
              },
              { path: "usuarios", lazy: () => import("@/features/usuarios/pages/PaginaUsuarios") },
              {
                path: "cuenta/contrasena",
                lazy: () => import("@/features/auth/pages/PaginaCambioContrasena"),
              },
              { path: "*", lazy: () => import("./PaginaNoEncontrada") },
            ],
          },
        ],
      },
    ],
  },
];
