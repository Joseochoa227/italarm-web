import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";

import { crearClienteConsultas } from "@/app/consultas";
import { Proveedores } from "@/app/Proveedores";
import { rutas } from "@/app/rutas";
import { guardarToken } from "@/api/token";

import { pantalla } from "./pantalla";
import { TOKEN } from "./servidor";

interface Opciones {
  /** Ruta inicial (por defecto, Inicio). */
  ruta?: string;
  /** Si hay un token guardado al cargar (por defecto, sí). */
  conToken?: boolean;
  /** Tamaño computador (por defecto) o celular. */
  escritorio?: boolean;
}

/** Monta la app completa (rutas reales, sesión, consultas y avisos) sobre la API simulada. */
export function renderizarApp({ ruta = "/", conToken = true, escritorio = true }: Opciones = {}) {
  pantalla.escritorio = escritorio;
  if (conToken) guardarToken(TOKEN);
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  const usuario = userEvent.setup();
  const resultado = render(
    <Proveedores clienteConsultas={crearClienteConsultas()}>
      <RouterProvider router={router} />
    </Proveedores>,
  );
  return { ...resultado, router, usuario };
}
