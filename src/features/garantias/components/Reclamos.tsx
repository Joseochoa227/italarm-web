import { useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Pencil } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { $api, api } from "@/api/cliente";
import type { components } from "@/api/esquema";
import { errorDeConsultas } from "@/api/problema";
import { Alerta } from "@/components/ui/Alerta";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CargandoLista } from "@/components/ui/CargandoLista";
import { useAvisar } from "@/components/ui/contextoAvisos";
import { Dialogo } from "@/components/ui/Dialogo";
import { EstadoError } from "@/components/ui/EstadoError";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { esConflictoDeVersion, MENSAJES_ERROR, mensajeDeError } from "@/lib/errores";
import { hoyBogota } from "@/lib/fechas";
import { formatearFecha, formatearFechaHora } from "@/lib/formato";

import { TEXTOS_GARANTIAS } from "../textos";

const R = TEXTOS_GARANTIAS.reclamos;
type Reclamo = components["schemas"]["ReclamoVista"];
const CLAVE_RECLAMOS = ["get", "/api/v1/garantias/reclamos"];

/** Registrar un reclamo (RF-125, P-45): fecha, problema y, si ya se sabe, la solución. */
export function RegistrarReclamo({
  sobre,
  objetivo,
  productoId,
}: {
  /** Texto de lo reclamado: "I-0001" o "Serial SN-0001". */
  sobre: string;
  objetivo: { instalacionId: number } | { serialId: number };
  /** Producto del equipo, para enlazar el ajuste de salida del reemplazo. */
  productoId?: number | undefined;
}) {
  const hoy = hoyBogota();
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(hoy);
  const [problema, setProblema] = useState("");
  const [solucion, setSolucion] = useState("");
  const [errorProblema, setErrorProblema] = useState<string>();
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);

  async function registrar() {
    if (!problema.trim()) {
      setErrorProblema(R.problemaRequerido);
      return;
    }
    setError(null);
    setOcupado(true);
    try {
      await api.POST("/api/v1/garantias/reclamos", {
        body: {
          ...objetivo,
          fecha,
          problema: problema.trim(),
          ...(solucion.trim() ? { solucion: solucion.trim() } : {}),
        },
      });
      // Los reclamos se ven en la instalación, en el serial y en Garantías.
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE_RECLAMOS });
      await clienteConsultas.invalidateQueries({ queryKey: ["get", "/api/v1/seriales/{id}"] });
      avisar({ titulo: R.registrado });
      setAbierto(false);
      setProblema("");
      setSolucion("");
      setFecha(hoy);
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <Boton
        onClick={() => {
          setAbierto(true);
        }}
      >
        <MessageSquarePlus aria-hidden size={16} />
        {R.registrar}
      </Boton>
      <Dialogo abierto={abierto} alCambiar={setAbierto} titulo={R.tituloRegistrar(sobre)}>
        <Campo
          etiqueta={R.fecha}
          type="date"
          max={hoy}
          value={fecha}
          onChange={(e) => {
            setFecha(e.target.value);
          }}
        />
        <AreaTexto
          etiqueta={R.problema}
          rows={3}
          maxLength={2000}
          value={problema}
          error={errorProblema}
          onChange={(e) => {
            setProblema(e.target.value);
            setErrorProblema(undefined);
          }}
        />
        <AreaTexto
          etiqueta={R.solucion}
          ayuda={R.solucionAyuda}
          rows={2}
          maxLength={2000}
          value={solucion}
          onChange={(e) => {
            setSolucion(e.target.value);
          }}
        />
        <Alerta tono="info">
          <span className="flex flex-col gap-1">
            {R.reemplazo}
            {productoId !== undefined && (
              <Link to={`/inventario/productos/${String(productoId)}/ajuste`}>{R.irAjuste}</Link>
            )}
          </span>
        </Alerta>
        {error !== null && (
          <Alerta tono="peligro" rol="alert">
            {mensajeDeError(error)}
          </Alerta>
        )}
        <Boton variante="primario" ocupado={ocupado} onClick={() => void registrar()}>
          {R.guardar}
        </Boton>
      </Dialogo>
    </>
  );
}

/** Escribir la solución de un reclamo después de registrarlo (P-45), con control de versión. */
function EscribirSolucion({ reclamo }: { reclamo: Reclamo }) {
  const avisar = useAvisar();
  const clienteConsultas = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [solucion, setSolucion] = useState(reclamo.solucion ?? "");
  const [errorSolucion, setErrorSolucion] = useState<string>();
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);

  async function guardar() {
    if (!solucion.trim()) {
      setErrorSolucion(R.solucionRequerida);
      return;
    }
    setError(null);
    setOcupado(true);
    try {
      await api.PUT("/api/v1/garantias/reclamos/{id}", {
        params: { path: { id: reclamo.id ?? 0 } },
        body: { solucion: solucion.trim(), version: reclamo.version ?? 0 },
      });
      avisar({ titulo: R.solucionGuardada });
      setAbierto(false);
    } catch (e) {
      setError(e);
    } finally {
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE_RECLAMOS });
      setOcupado(false);
    }
  }

  return (
    <>
      <Boton
        variante="fantasma"
        className="self-start"
        onClick={() => {
          setAbierto(true);
        }}
      >
        <Pencil aria-hidden size={16} />
        {R.escribirSolucion}
      </Boton>
      <Dialogo abierto={abierto} alCambiar={setAbierto} titulo={R.tituloSolucion}>
        <p className="m-0 text-sm text-neutro-700">{reclamo.problema}</p>
        <AreaTexto
          etiqueta={R.solucion}
          rows={3}
          maxLength={2000}
          value={solucion}
          error={errorSolucion}
          onChange={(e) => {
            setSolucion(e.target.value);
            setErrorSolucion(undefined);
          }}
        />
        {error !== null && (
          <Alerta tono={esConflictoDeVersion(error) ? "aviso" : "peligro"} rol="alert">
            {esConflictoDeVersion(error) ? MENSAJES_ERROR.conflicto : mensajeDeError(error)}
          </Alerta>
        )}
        <Boton variante="primario" ocupado={ocupado} onClick={() => void guardar()}>
          {R.guardar}
        </Boton>
      </Dialogo>
    </>
  );
}

/** Reclamos de una instalación, de un serial o de un cliente (RF-125): no se borran (P-45). */
export function ListaReclamos({
  filtro,
}: {
  filtro: { instalacionId: number } | { serialId: number } | { clienteId: number };
}) {
  const consulta = $api.useQuery("get", "/api/v1/garantias/reclamos", { params: { query: filtro } });
  const falla = errorDeConsultas(consulta);
  const reclamos = consulta.data ?? [];
  if (falla) return <EstadoError error={falla} alReintentar={() => void consulta.refetch()} />;
  if (consulta.isPending) return <CargandoLista filas={2} />;
  if (reclamos.length === 0) return <p className="m-0 text-sm text-neutro-700">{R.vacio}</p>;
  return (
    <ul aria-label={R.titulo} className="m-0 flex list-none flex-col p-0">
      {reclamos.map((r) => (
        <li key={r.id} className="flex flex-col gap-1 border-b border-divisor py-2.5 text-sm">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-neutro-700">{r.fecha ? formatearFecha(r.fecha) : ""}</span>
            {[r.documento, r.serial].filter(Boolean).join(" · ")}
            {r.enGarantia === false && <Etiqueta tono="peligro">{R.fueraDeGarantia}</Etiqueta>}
          </span>
          <span>{r.problema}</span>
          {r.solucion ? (
            <span className="text-neutro-700">
              {R.solucion}: {r.solucion}
            </span>
          ) : (
            <span className="text-neutro-700 italic">{R.pendiente}</span>
          )}
          {r.registradoPor && r.registradoEn && (
            <span className="text-xs text-neutro-700">
              {R.registradoPor(r.registradoPor, formatearFechaHora(r.registradoEn))}
            </span>
          )}
          {!r.solucion && <EscribirSolucion reclamo={r} />}
        </li>
      ))}
    </ul>
  );
}
