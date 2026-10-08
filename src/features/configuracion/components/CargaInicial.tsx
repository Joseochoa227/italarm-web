import { useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { $api, api } from "@/api/cliente";
import { comoFormulario } from "@/api/archivos";
import type { components } from "@/api/esquema";
import { comoErrorApi, errorDeConsultas } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { EstadoError } from "@/components/ui/EstadoError";
import { Celda, Tabla } from "@/components/ui/Tabla";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { guardarArchivo, nombreDeArchivo } from "@/lib/descargas";
import { mensajeDeError } from "@/lib/errores";
import { formatearDineroDe, formatearFecha } from "@/lib/formato";
import { useClaveIdempotencia } from "@/lib/idempotencia";
import { TAMANO_MAXIMO } from "@/lib/imagen";

import { TEXTOS_CONFIGURACION } from "../textos";

const T = TEXTOS_CONFIGURACION.carga;
const TIPO_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
interface ErrorCarga {
  hoja?: string | null;
  fila?: number | null;
  mensaje?: string;
}
type Resumen = components["schemas"]["ResultadoCargaVistaResumen"];

/** Errores agrupados por hoja, con el número de fila de Excel (RF-150, CP-29). */
function ErroresCarga({ errores }: { errores: readonly ErrorCarga[] }) {
  const porHoja = new Map<string, ErrorCarga[]>();
  for (const e of errores) {
    const hoja = e.hoja ?? "";
    porHoja.set(hoja, [...(porHoja.get(hoja) ?? []), e]);
  }
  return (
    <div role="alert" className="flex flex-col gap-3">
      <Alerta tono="peligro">{T.conErrores(errores.length)}</Alerta>
      {[...porHoja].map(([hoja, lista]) => (
        <section key={hoja} aria-label={T.erroresDe(hoja)} className="flex flex-col gap-1">
          <h4 className="m-0 text-sm font-semibold">{T.erroresDe(hoja)}</h4>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
            {lista.map((e, i) => (
              <li key={i} className="flex gap-2">
                {e.fila != null && (
                  <span className="w-[64px] shrink-0 text-neutro-700">{T.fila(e.fila)}</span>
                )}
                <span>{e.mensaje}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ResumenCarga({ resumen }: { resumen: Resumen | undefined }) {
  const datos = [
    [T.productos, resumen?.productos],
    [T.clientes, resumen?.clientes],
    [T.proveedores, resumen?.proveedores],
    [T.productosConStock, resumen?.productosConStock],
  ] as const;
  return (
    <div className="flex flex-col gap-2">
      <Alerta tono="info" rol="status">
        {T.valido}
      </Alerta>
      <span className="rotulo text-acento-700">{T.resumen}</span>
      <dl className="m-0 flex flex-wrap gap-x-8 gap-y-3">
        {datos.map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <dt className="text-xs text-neutro-700">{etiqueta}</dt>
            <dd className="m-0 font-titulo text-xl font-semibold">{valor ?? 0}</dd>
          </div>
        ))}
        <div>
          <dt className="text-xs text-neutro-700">{T.valor}</dt>
          <dd className="m-0 font-titulo text-xl font-semibold">
            {resumen?.valorUsd ? formatearDineroDe(resumen.valorUsd) : "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Carga inicial desde Excel (3.18, RF-149 a RF-152): plantilla, validación, confirmación e historial. */
export function CargaInicial() {
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const entrada = useRef<HTMLInputElement>(null);
  const { clave, renovar } = useClaveIdempotencia();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<"libre" | "validando" | "guardando" | "descargando">("libre");
  const [resultado, setResultado] = useState<components["schemas"]["ResultadoCargaVista"] | null>(null);
  const [errores, setErrores] = useState<readonly ErrorCarga[]>([]);
  const [error, setError] = useState<string | null>(null);
  const cargas = $api.useQuery("get", "/api/v1/carga-inicial");
  const errorCargas = errorDeConsultas(cargas);

  function reiniciar() {
    setResultado(null);
    setErrores([]);
    setError(null);
  }

  async function descargar() {
    setError(null);
    setEstado("descargando");
    try {
      const { data, response } = await api.GET("/api/v1/carga-inicial/plantilla", { parseAs: "blob" });
      if (data) {
        guardarArchivo(data, nombreDeArchivo(response.headers.get("Content-Disposition"), T.nombrePlantilla));
      }
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setEstado("libre");
    }
  }

  async function validar(elegido: File) {
    reiniciar();
    setArchivo(null);
    if (!elegido.name.toLowerCase().endsWith(".xlsx")) {
      setError(T.soloXlsx);
      return;
    }
    if (elegido.size > TAMANO_MAXIMO) {
      setError(T.tamano);
      return;
    }
    // Otro archivo es otra carga: nueva clave de idempotencia (guía §9).
    renovar();
    setArchivo(elegido);
    setEstado("validando");
    try {
      const { data } = await api.POST("/api/v1/carga-inicial/validar", {
        body: { archivo: elegido },
        bodySerializer: comoFormulario,
      });
      setResultado(data ?? null);
      setErrores(data?.errores ?? []);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setEstado("libre");
    }
  }

  async function confirmar() {
    if (!archivo) return;
    setError(null);
    setEstado("guardando");
    try {
      const { data } = await api.POST("/api/v1/carga-inicial", {
        params: { header: { "Idempotency-Key": clave } },
        body: { archivo },
        bodySerializer: comoFormulario,
      });
      avisar({ titulo: T.registrada(data?.consecutivo ?? "") });
      reiniciar();
      setArchivo(null);
      renovar();
      await clienteConsultas.invalidateQueries();
    } catch (e) {
      const problema = comoErrorApi(e);
      if (problema.codigo === "CARGA_INICIAL_CON_ERRORES" && problema.errores.length > 0) {
        setResultado(null);
        setErrores(problema.errores);
      } else {
        setError(mensajeDeError(problema));
      }
    } finally {
      setEstado("libre");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Tarjeta className="gap-3">
        <h3 className="m-0 text-lg">
          <span className="text-acento-700">1</span> {T.paso1}
        </h3>
        <p className="m-0 text-sm text-neutro-700">{T.paso1Texto}</p>
        <div>
          <Boton ocupado={estado === "descargando"} onClick={() => void descargar()}>
            <Download aria-hidden size={16} />
            {T.descargar}
          </Boton>
        </div>
      </Tarjeta>

      <Tarjeta className="gap-3">
        <h3 className="m-0 text-lg">
          <span className="text-acento-700">2</span> {T.paso2}
        </h3>
        <p className="m-0 text-sm text-neutro-700">{T.paso2Texto}</p>
        <input
          ref={entrada}
          type="file"
          accept={`.xlsx,${TIPO_XLSX}`}
          className="sr-only"
          tabIndex={-1}
          aria-label={T.archivo}
          onChange={(e) => {
            const elegido = e.target.files?.[0];
            e.target.value = "";
            if (elegido) void validar(elegido);
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Boton
            ocupado={estado === "validando"}
            disabled={estado !== "libre"}
            onClick={() => entrada.current?.click()}
          >
            <Upload aria-hidden size={16} />
            {T.elegir}
          </Boton>
          {archivo && (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <FileSpreadsheet aria-hidden size={16} className="text-acento-700" />
              {archivo.name}
            </span>
          )}
        </div>
        {estado === "validando" && (
          <p role="status" className="m-0 text-sm text-neutro-700">
            {T.validando}
          </p>
        )}
        {error && (
          <Alerta tono="peligro" rol="alert">
            {error}
          </Alerta>
        )}
        {errores.length > 0 && <ErroresCarga errores={errores} />}
        {resultado?.valido && <ResumenCarga resumen={resultado.resumen} />}
      </Tarjeta>

      {resultado?.valido && archivo && (
        <Tarjeta className="gap-3">
          <h3 className="m-0 text-lg">
            <span className="text-acento-700">3</span> {T.paso3}
          </h3>
          <div>
            <Boton variante="primario" ocupado={estado === "guardando"} onClick={() => void confirmar()}>
              {T.confirmar}
            </Boton>
          </div>
        </Tarjeta>
      )}

      <section aria-labelledby="titulo-cargas" className="flex flex-col gap-2">
        <h3 id="titulo-cargas" className="m-0 text-lg">
          {T.realizadas}
        </h3>
        {errorCargas ? (
          <EstadoError error={errorCargas} alReintentar={() => void cargas.refetch()} />
        ) : cargas.isPending ? (
          <CargandoLista filas={2} />
        ) : (cargas.data ?? []).length === 0 ? (
          <p className="m-0 text-sm text-neutro-700">{T.sinCargas}</p>
        ) : (
          <Tabla etiqueta={T.realizadas} columnas={Object.values(T.columnas)}>
            {(cargas.data ?? []).map((c) => (
              <tr key={c.id} className="border-b border-tinta/8">
                <Celda>{c.consecutivo}</Celda>
                <Celda>{c.fecha ? formatearFecha(c.fecha) : ""}</Celda>
                <Celda>{c.registradaPor}</Celda>
                <Celda>{c.archivo}</Celda>
                <Celda>
                  {T.totales(c.productosCreados ?? 0, c.clientesCreados ?? 0, c.proveedoresCreados ?? 0)}
                </Celda>
                <Celda derecha>{c.valorUsd ? formatearDineroDe(c.valorUsd) : "—"}</Celda>
              </tr>
            ))}
          </Tabla>
        )}
      </section>
    </div>
  );
}
