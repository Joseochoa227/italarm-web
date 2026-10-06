import type { components } from "@/api/esquema";

import type { EntradaCliente } from "../schemas/cliente";

export type Cliente = components["schemas"]["ClienteVista"];

export const CLAVE_CLIENTES = ["get", "/api/v1/clientes"];

export const CLIENTE_VACIO: EntradaCliente = {
  tipo: "CLIENTE_FINAL",
  nombre: "",
  tipoDocumento: "",
  numeroDocumento: "",
  telefono: "",
  correo: "",
  direccion: "",
  ciudad: "",
};

export function valoresDeCliente(c: Cliente): EntradaCliente {
  return {
    tipo: c.tipo ?? "CLIENTE_FINAL",
    nombre: c.nombre ?? "",
    tipoDocumento: c.tipoDocumento ?? "",
    numeroDocumento: c.numeroDocumento ?? "",
    telefono: c.telefono ?? "",
    correo: c.correo ?? "",
    direccion: c.direccion ?? "",
    ciudad: c.ciudad ?? "",
  };
}

/** Iniciales para el círculo del listado: "Ferretería El Tornillo" → "FE". */
export function iniciales(nombre: string | undefined): string {
  const palabras = (nombre ?? "").trim().split(/\s+/).filter(Boolean);
  return (
    palabras
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

/** Enlace de WhatsApp: el teléfono llega con indicativo (+573001234567, P-10). */
export function enlaceWhatsapp(telefono: string | undefined): string | null {
  const digitos = (telefono ?? "").replace(/\D/g, "");
  return digitos ? `https://wa.me/${digitos}` : null;
}
