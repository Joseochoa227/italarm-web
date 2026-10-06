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
              { path: "ventas/nueva", lazy: () => import("@/features/ventas/pages/PaginaNuevaVenta") },
              {
                path: "instalaciones/nueva",
                lazy: () => import("@/features/instalaciones/pages/PaginaNuevaInstalacion"),
              },
              { path: "compras", lazy: () => import("@/features/compras/pages/PaginaCompras") },
              { path: "compras/nueva", lazy: () => import("@/features/compras/pages/PaginaNuevaCompra") },
              {
                path: "cotizaciones",
                lazy: () => import("@/features/cotizaciones/pages/PaginaCotizaciones"),
              },
              {
                path: "cotizaciones/nueva",
                lazy: () => import("@/features/cotizaciones/pages/PaginaNuevaCotizacion"),
              },
              { path: "clientes", lazy: () => import("@/features/clientes/pages/PaginaClientes") },
              { path: "tasas", lazy: () => import("@/features/tasas/pages/PaginaTasas") },
              { path: "reportes", lazy: () => import("@/features/reportes/pages/PaginaReportes") },
              {
                path: "configuracion",
                lazy: () => import("@/features/configuracion/pages/PaginaConfiguracion"),
              },
              { path: "usuarios", lazy: () => import("@/features/configuracion/pages/PaginaUsuarios") },
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
