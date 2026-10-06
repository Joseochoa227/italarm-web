import "@/styles/global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { ActualizacionPwa } from "@/app/ActualizacionPwa";
import { crearClienteConsultas } from "@/app/consultas";
import { ErrorConfiguracion } from "@/app/ErrorConfiguracion";
import { Proveedores } from "@/app/Proveedores";
import { rutas } from "@/app/rutas";
import { configuracion } from "@/lib/entorno";

const raiz = document.getElementById("raiz");
if (!raiz) throw new Error("Falta el elemento #raiz en index.html");

if (configuracion.error !== null) {
  // Sin la URL de la API la app no puede funcionar: se explica en pantalla en lugar de quedar en blanco.
  createRoot(raiz).render(<ErrorConfiguracion mensaje={configuracion.error} />);
} else {
  const router = createBrowserRouter(rutas);
  createRoot(raiz).render(
    <StrictMode>
      <Proveedores clienteConsultas={crearClienteConsultas()}>
        <RouterProvider router={router} />
        <ActualizacionPwa />
      </Proveedores>
    </StrictMode>,
  );
}
