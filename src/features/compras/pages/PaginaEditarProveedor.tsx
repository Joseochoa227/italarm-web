import { ShoppingCart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { $api, api } from "@/api/cliente";
import { comoErrorApi, errorDeConsultas } from "@/api/problema";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EnlaceBoton } from "@/components/ui/EnlaceBoton";
import { EstadoError } from "@/components/ui/EstadoError";
import { esConflictoDeVersion } from "@/lib/errores";
import { sinIndefinidos } from "@/lib/objetos";

import { FormularioProveedor } from "../components/FormularioProveedor";
import type { DatosProveedor } from "../schemas/proveedor";
import { TEXTOS_COMPRAS } from "../textos";

const F = TEXTOS_COMPRAS.formulario;
const LISTA = "/compras?pestana=proveedores";

export function Component() {
  const id = Number(useParams().id);
  const avisar = useAvisar();
  const navegar = useNavigate();
  const clienteConsultas = useQueryClient();
  const consulta = $api.useQuery("get", "/api/v1/proveedores/{id}", { params: { path: { id } } });
  const [conflicto, setConflicto] = useState(false);
  const guardado = useMutation({
    mutationFn: async (datos: DatosProveedor) =>
      (
        await api.PUT("/api/v1/proveedores/{id}", {
          params: { path: { id } },
          body: { ...sinIndefinidos(datos), version: consulta.data?.version ?? 0 },
        })
      ).data,
    onMutate: () => {
      setConflicto(false);
    },
    onSuccess: async () => {
      await clienteConsultas.invalidateQueries({ queryKey: ["get", "/api/v1/proveedores"] });
      await clienteConsultas.invalidateQueries({ queryKey: ["get", "/api/v1/proveedores/{id}"] });
      avisar({ titulo: F.guardado });
      void navegar(LISTA);
    },
    onError: async (e) => {
      if (esConflictoDeVersion(e)) {
        await consulta.refetch();
        setConflicto(true);
      }
    },
  });
  const error = errorDeConsultas(consulta);
  if (error) return <EstadoError error={error} alReintentar={() => void consulta.refetch()} />;
  const p = consulta.data;
  if (!p) return <CargandoLista filas={3} />;
  return (
    <>
      <EncabezadoPagina
        titulo={F.tituloEditar}
        volver={{ a: LISTA, etiqueta: F.volver }}
        acciones={
          <EnlaceBoton a={`/compras?proveedor=${String(id)}`} icono={<ShoppingCart aria-hidden size={16} />}>
            {TEXTOS_COMPRAS.proveedores.verCompras}
          </EnlaceBoton>
        }
      />
      <FormularioProveedor
        key={p.version}
        valores={{
          nombre: p.nombre ?? "",
          nit: p.nit ?? "",
          telefono: p.telefono ?? "",
          correo: p.correo ?? "",
          ciudad: p.ciudad ?? "",
          monedaHabitual: p.monedaHabitual ?? "USD",
        }}
        ocupado={guardado.isPending}
        error={guardado.error ? comoErrorApi(guardado.error) : null}
        conflicto={conflicto}
        alGuardar={(datos) => {
          guardado.mutate(datos);
        }}
      />
    </>
  );
}
