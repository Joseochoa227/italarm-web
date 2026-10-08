import { useQueryClient } from "@tanstack/react-query";
import { Plus, UserRound } from "lucide-react";
import { useState } from "react";

import { $api, api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { comoErrorApi, errorDeConsultas, type ErrorApi } from "@/api/problema";
import { Boton } from "@/components/ui/Boton";
import { Buscador } from "@/components/ui/Buscador";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { Dialogo } from "@/components/ui/Dialogo";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { EstadoError } from "@/components/ui/EstadoError";
import { FormularioCliente } from "@/features/clientes/components/FormularioCliente";
import { CLAVE_CLIENTES, CLIENTE_VACIO } from "@/features/clientes/hooks/clientes";
import { TEXTOS_CLIENTES } from "@/features/clientes/textos";
import { sinIndefinidos } from "@/lib/objetos";

import { TEXTOS_COMERCIAL } from "../textos";

const T = TEXTOS_COMERCIAL.cliente;
export type Cliente = components["schemas"]["ClienteVista"];

function NuevoCliente({ alCrear }: { alCrear: (cliente: Cliente) => void }) {
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<ErrorApi | null>(null);
  return (
    <>
      <Boton
        variante="fantasma"
        onClick={() => {
          setError(null);
          setAbierto(true);
        }}
      >
        <Plus aria-hidden size={16} />
        {T.nuevo}
      </Boton>
      <Dialogo abierto={abierto} alCambiar={setAbierto} titulo={T.tituloNuevo} amplio>
        <FormularioCliente
          valores={CLIENTE_VACIO}
          ocupado={ocupado}
          error={error}
          alGuardar={(datos) => {
            setOcupado(true);
            setError(null);
            // D-04: el contrato pide version también al crear; el backend la ignora.
            api
              .POST("/api/v1/clientes", { body: { ...sinIndefinidos(datos), version: 0 } })
              .then(async ({ data }) => {
                await clienteConsultas.invalidateQueries({ queryKey: CLAVE_CLIENTES });
                avisar({ titulo: T.creado });
                setAbierto(false);
                if (data) alCrear(data);
              })
              .catch((e: unknown) => {
                setError(comoErrorApi(e));
              })
              .finally(() => {
                setOcupado(false);
              });
          }}
        />
      </Dialogo>
    </>
  );
}

/**
 * Cliente de un documento (RF-98): se busca o se crea sin salir del formulario (RF-79), y se muestra
 * su tipo y el precio que se le aplicará (RF-78).
 */
export function SelectorCliente({
  cliente,
  alElegir,
  error,
}: {
  cliente: Cliente | null;
  alElegir: (cliente: Cliente) => void;
  error?: string | undefined;
}) {
  const [abierto, setAbierto] = useState(false);
  const [buscar, setBuscar] = useState("");
  const consulta = $api.useQuery(
    "get",
    "/api/v1/clientes",
    { params: { query: { size: 10, page: 0, ...(buscar ? { buscar } : {}) } } },
    { enabled: abierto },
  );
  const falla = errorDeConsultas(consulta);
  const clientes = consulta.data?.contenido ?? [];
  const elegir = (c: Cliente) => {
    alElegir(c);
    setAbierto(false);
    setBuscar("");
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-tinta/70">{T.etiqueta}</span>
      {cliente ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-divisor px-3 py-2">
          <UserRound aria-hidden size={20} className="shrink-0 text-acento-700" />
          <div className="min-w-0 flex-1">
            <div className="font-medium">{cliente.nombre}</div>
            <div className="text-xs text-neutro-700">{cliente.precioAplicadoDescripcion}</div>
          </div>
          {cliente.tipo && <Etiqueta tono="acento">{TEXTOS_CLIENTES.tipos[cliente.tipo]}</Etiqueta>}
          <Boton
            variante="fantasma"
            onClick={() => {
              setAbierto(true);
            }}
          >
            {T.cambiar}
          </Boton>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Boton
            onClick={() => {
              setAbierto(true);
            }}
          >
            <UserRound aria-hidden size={16} />
            {T.elegir}
          </Boton>
          <NuevoCliente alCrear={alElegir} />
        </div>
      )}
      {error && (
        <p role="alert" className="m-0 text-xs font-medium text-peligro-700">
          {error}
        </p>
      )}
      <Dialogo abierto={abierto} alCambiar={setAbierto} titulo={T.titulo}>
        <Buscador etiqueta={T.buscar} placeholder={T.buscar} valor={buscar} alBuscar={setBuscar} />
        {falla ? (
          <EstadoError error={falla} alReintentar={() => void consulta.refetch()} />
        ) : consulta.isPending ? (
          <CargandoLista filas={3} />
        ) : clientes.length === 0 ? (
          <p className="m-0 text-sm text-neutro-700">{T.vacio}</p>
        ) : (
          <ul
            aria-label={T.resultados}
            className="m-0 flex max-h-[50dvh] list-none flex-col gap-1 overflow-y-auto p-0"
          >
            {clientes.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    elegir(c);
                  }}
                  className="flex min-h-[48px] w-full cursor-pointer flex-col justify-center rounded-md px-2 text-left hover:bg-tenue"
                >
                  <span className="font-medium">{c.nombre}</span>
                  <span className="text-xs text-neutro-700">
                    {[c.tipo ? TEXTOS_CLIENTES.tipos[c.tipo] : null, c.numeroDocumento, c.ciudad]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {cliente && (
          <div>
            <NuevoCliente alCrear={elegir} />
          </div>
        )}
      </Dialogo>
    </div>
  );
}
