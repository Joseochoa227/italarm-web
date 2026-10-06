import "@/styles/global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { ActualizacionPwa } from "@/app/ActualizacionPwa";
import { crearClienteConsultas } from "@/app/consultas";
import { Proveedores } from "@/app/Proveedores";
import { rutas } from "@/app/rutas";

const raiz = document.getElementById("raiz");
if (!raiz) throw new Error("Falta el elemento #raiz en index.html");

const router = createBrowserRouter(rutas);

createRoot(raiz).render(
  <StrictMode>
    <Proveedores clienteConsultas={crearClienteConsultas()}>
      <RouterProvider router={router} />
      <ActualizacionPwa />
    </Proveedores>
  </StrictMode>,
);
