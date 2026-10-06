import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { $api, api, registrarAlNoAutenticado } from "@/api/cliente";
import { borrarToken, guardarToken, leerToken } from "@/api/token";

import { ContextoSesion, type RespuestaIngreso, type Sesion } from "../hooks/contextoSesion";

const CONSULTA_SESION = $api.queryOptions("get", "/api/v1/sesion");

/**
 * Sesión con token Bearer (P-05, guía §1). El usuario conectado es la consulta GET /sesion de
 * TanStack Query (BF-03); aquí solo se guarda si hay token, que es estado del navegador.
 */
export function ProveedorSesion({ children }: { children: ReactNode }) {
  const clienteConsultas = useQueryClient();
  const [hayToken, setHayToken] = useState(() => leerToken() !== null);

  const terminar = useCallback(() => {
    borrarToken();
    setHayToken(false);
    clienteConsultas.clear();
  }, [clienteConsultas]);

  // Cualquier 401 (token cerrado, contraseña cambiada en otro equipo, usuario desactivado).
  useEffect(() => registrarAlNoAutenticado(terminar), [terminar]);

  const consulta = $api.useQuery("get", "/api/v1/sesion", undefined, {
    enabled: hayToken,
    staleTime: Infinity,
  });

  const iniciar = useCallback(
    ({ token, usuario }: RespuestaIngreso) => {
      if (!token || !usuario) return;
      guardarToken(token);
      clienteConsultas.setQueryData(CONSULTA_SESION.queryKey, usuario);
      setHayToken(true);
    },
    [clienteConsultas],
  );

  const cerrar = useCallback(async () => {
    try {
      await api.DELETE("/api/v1/sesion");
    } catch {
      // Sin conexión o token ya inválido: igual se cierra en este navegador.
    } finally {
      terminar();
    }
  }, [terminar]);

  const { data, isPending, error, refetch } = consulta;
  const sesion = useMemo<Sesion>(
    () => ({
      usuario: hayToken ? (data ?? null) : null,
      validando: hayToken && isPending && !error,
      error: hayToken ? error : null,
      reintentar: () => void refetch(),
      iniciar,
      cerrar,
    }),
    [hayToken, data, isPending, error, refetch, iniciar, cerrar],
  );

  return <ContextoSesion.Provider value={sesion}>{children}</ContextoSesion.Provider>;
}
