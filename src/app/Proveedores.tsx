import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ProveedorAvisos } from "@/components/ui/Avisos";
import { ProveedorSesion } from "@/features/auth/components/ProveedorSesion";

/** Proveedores de la app: datos del servidor, avisos y sesión. */
export function Proveedores({
  clienteConsultas,
  children,
}: {
  clienteConsultas: QueryClient;
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={clienteConsultas}>
      <ProveedorAvisos>
        <ProveedorSesion>{children}</ProveedorSesion>
      </ProveedorAvisos>
    </QueryClientProvider>
  );
}
