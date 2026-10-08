import { ScanLine, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { $api } from "@/api/cliente";
import { errorDeConsultas } from "@/api/problema";
import { Escaner } from "@/components/seriales/Escaner";
import { TEXTOS_SERIALES } from "@/components/seriales/textos";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { Dialogo } from "@/components/ui/Dialogo";
import { EstadoError } from "@/components/ui/EstadoError";
import { normalizarSerial } from "@/lib/seriales";

import { TEXTOS_INVENTARIO } from "../textosInventario";

const T = TEXTOS_INVENTARIO.buscarSerial;

/**
 * Búsqueda de un serial desde cualquier pantalla (RF-24, W-06): se escribe o se escanea, y cada
 * resultado lleva a su historial. Se carga de forma diferida desde el menú.
 */
export default function DialogoBuscarSerial({ alCerrar }: { alCerrar: () => void }) {
  const [texto, setTexto] = useState("");
  const [numero, setNumero] = useState("");
  const [error, setError] = useState<string>();
  const [escaneando, setEscaneando] = useState(false);
  const consulta = $api.useQuery(
    "get",
    "/api/v1/seriales",
    { params: { query: { numero } } },
    { enabled: numero !== "" },
  );
  const errorConsulta = errorDeConsultas(consulta);
  const seriales = consulta.data ?? [];

  function buscar(valor: string) {
    const normalizado = normalizarSerial(valor);
    setTexto(normalizado);
    if (normalizado.length < 2) {
      setError(T.minimo);
      return;
    }
    setError(undefined);
    setNumero(normalizado);
  }

  return (
    <Dialogo
      abierto
      alCambiar={(abierto) => {
        if (!abierto) alCerrar();
      }}
      titulo={T.titulo}
    >
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          buscar(texto);
        }}
        noValidate
        className="flex flex-col gap-3"
      >
        <Campo
          etiqueta={T.campo}
          value={texto}
          error={error}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          onChange={(e) => {
            setTexto(e.target.value);
          }}
        />
        <div className="flex gap-2">
          <Boton type="submit" variante="primario" className="flex-1" ocupado={consulta.isFetching}>
            <Search aria-hidden size={16} />
            {T.buscar}
          </Boton>
          <Boton
            onClick={() => {
              setEscaneando(true);
            }}
          >
            <ScanLine aria-hidden size={16} />
            {TEXTOS_SERIALES.escanear}
          </Boton>
        </div>
      </form>
      {numero !== "" &&
        (errorConsulta ? (
          <EstadoError error={errorConsulta} alReintentar={() => void consulta.refetch()} />
        ) : consulta.isPending ? (
          <CargandoLista filas={2} />
        ) : seriales.length === 0 ? (
          <p role="status" className="m-0 text-sm text-neutro-700">
            {T.vacio}
          </p>
        ) : (
          <ul
            aria-label={T.resultados}
            className="m-0 flex max-h-[50dvh] list-none flex-col gap-1 overflow-y-auto p-0"
          >
            {seriales.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/seriales/${String(s.id)}`}
                  onClick={alCerrar}
                  className="flex min-h-[48px] flex-col justify-center rounded-md px-2 text-tinta no-underline hover:bg-tenue hover:text-tinta"
                >
                  <span className="font-mono font-medium">{s.numero}</span>
                  <span className="text-xs text-neutro-700">
                    {[
                      s.producto?.nombre,
                      s.estado ? (TEXTOS_INVENTARIO.estadoSerial[s.estado] ?? s.estado) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
      {escaneando && (
        <Escaner
          alLeer={(leido) => {
            setEscaneando(false);
            buscar(leido);
          }}
          alCerrar={() => {
            setEscaneando(false);
          }}
        />
      )}
    </Dialogo>
  );
}
