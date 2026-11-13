/*
 * ViajeDetailSection. Presentacional (salvo el aviso de emergencia, que lee la caché).
 *
 * Reconstruido sobre `ViajeSeguimiento` del contrato `bff` (recorte al contrato): la
 * vista del cliente es CURADA (DEC-006). Muestra el recorrido del viaje, el hito actual,
 * el ETA estimado con su marca de obsolescencia, y las incidencias curadas (categoría +
 * estado + marca de tiempo, y el impacto en el ETA si el contrato lo trae), nunca el
 * tipo interno de incidencia.
 *
 * Estructura: arriba, volver al historial; título, estado y acceso a la conversación; y el
 * aviso de emergencia activa (si la hay). Debajo, dos columnas desde `lg`: a la izquierda el
 * seguimiento (recorrido en cuatro pasos, hito y ETA, incidencias) y a la derecha las
 * acciones del cliente (cancelar o rechazar, emergencia). En pantallas angostas se apilan.
 *
 * Lo que el contrato NO expone aquí y por eso no se pinta: origen, destino, tipo de
 * servicio, fecha programada, unidad y operador (el resumen de ruta que traen otros
 * diseños), además de folio, fecha de solicitud y "condiciones activas". Volverán si el
 * contrato los publica. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */

import { Link } from '@tanstack/react-router';
import { ChevronLeft, CircleCheck, MessageSquare, TriangleAlert } from 'lucide-react';
import { Badge, Card, CardBody } from '@ai27-tech/ui';
import type { EstadoViaje, IncidenciaCurada, ViajeSeguimiento } from '@/lib/contracts';
import { formatDateTime } from '@/lib/utils';
import { conservarFiltro } from './filtroEstado';
import { CancelarRechazarPanel } from './CancelarRechazarPanel';
import { EmergenciaPanel } from './EmergenciaPanel';
import { EstadoViajeChip } from './EstadoViajeChip';
import { ProgresoViaje } from './ProgresoViaje';
import { useEmergencias } from './useEmergencias';

/**
 * Rótulo que encabeza cada columna ("Seguimiento", "Acciones").
 */
const CLASE_ROTULO_COLUMNA =
  'text-on-surface-variant text-xs font-semibold tracking-wider uppercase';

/**
 * Id del bloque de emergencia: destino del enlace "Ver casos" del aviso. Debe
 * coincidir con el `id` del encabezado de casos en `EmergenciaPanel`.
 */
const ID_CASOS_EMERGENCIA = 'emergencia-casos';

function verCasosDeEmergencia(): void {
  document
    .getElementById(ID_CASOS_EMERGENCIA)
    ?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
}

/** Una incidencia curada: en atención se resalta como advertencia; resuelta, en calma. */
function IncidenciaItem({ incidencia }: { readonly incidencia: IncidenciaCurada }) {
  const enAtencion = incidencia.estado === 'en_atencion';
  return (
    <li
      className={
        'flex items-start justify-between gap-3 rounded-md border px-3 py-2.5 ' +
        (enAtencion
          ? 'border-warning/40 bg-warning/10'
          : 'border-outline-variant bg-surface-container')
      }
    >
      <div className="flex min-w-0 items-start gap-3">
        {enAtencion ? (
          <TriangleAlert aria-hidden="true" className="text-warning mt-0.5 size-4 shrink-0" />
        ) : (
          <CircleCheck aria-hidden="true" className="text-success mt-0.5 size-4 shrink-0" />
        )}
        <div className="min-w-0 text-sm">
          <span className={'font-medium ' + (enAtencion ? 'text-warning' : 'text-on-surface')}>
            {incidencia.categoria}
          </span>
          <span className="text-on-surface-variant block text-xs">
            {formatDateTime(incidencia.marca_tiempo)}
          </span>
          {/* impacto_eta es opcional y nullable en el contrato.*/}
          {incidencia.impacto_eta !== undefined && incidencia.impacto_eta !== null && (
            <span className="text-on-surface-variant mt-1 block text-xs">
              Impacto en el ETA: {incidencia.impacto_eta}
            </span>
          )}
        </div>
      </div>
      <Badge variant={enAtencion ? 'warning' : 'secure'} pill>
        {enAtencion ? 'En atención' : 'Resuelta'}
      </Badge>
    </li>
  );
}

export function ViajeDetailSection({
  viaje,
  estadoHistorial,
}: {
  readonly viaje: ViajeSeguimiento;
  readonly estadoHistorial?: EstadoViaje | undefined;
}) {
  const { hito, eta, incidencias } = viaje;
  const filtro = conservarFiltro(estadoHistorial);
  // Misma clave de caché que usa `EmergenciaPanel`: no es una segunda petición.
  const { consulta: emergencias } = useEmergencias(viaje.id);
  const emergenciaActiva = emergencias.data?.emergencia_activa ?? false;

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/viajes"
        search={filtro}
        className="text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1 self-start text-sm font-medium"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Volver al historial
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-on-surface text-2xl font-bold">Viaje {viaje.id}</h1>
          {/* El estado del hito es un token del enum del contrato (ADR 19). */}
          <EstadoViajeChip estado={hito.estado as EstadoViaje} />
        </div>
        <Link
          to="/viajes/$viajeId/conversacion"
          params={{ viajeId: viaje.id }}
          search={filtro}
          className="border-outline-variant text-on-surface hover:bg-surface-container inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium"
        >
          <MessageSquare aria-hidden="true" className="size-4" />
          Conversación
        </Link>
      </header>

      {emergenciaActiva && (
        <div
          role="status"
          className="border-error/40 bg-error/10 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm"
        >
          <span className="text-error flex items-center gap-2 font-semibold">
            <span aria-hidden="true" className="bg-error size-2.5 rounded-full" />
            Hay una emergencia activa en este viaje.
          </span>
          <button
            type="button"
            onClick={verCasosDeEmergencia}
            className="text-error text-sm font-medium underline underline-offset-2"
          >
            Ver casos ↓
          </button>
        </div>
      )}

      {/*
        Dos columnas desde `lg`: a la izquierda el seguimiento (recorrido, hito, ETA e
        incidencias) y a la derecha las acciones del cliente. En pantallas angostas se
        apilan en ese mismo orden. `minmax(0, …)` deja que el contenido se encoja en vez
        de ensanchar la columna.
      */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <section aria-labelledby="seguimiento" className="flex flex-col gap-4">
          <h2 id="seguimiento" className={CLASE_ROTULO_COLUMNA}>
            Seguimiento
          </h2>
          <ProgresoViaje estado={hito.estado} />

          <div className="grid gap-4 xl:grid-cols-2">
            {hito.etiqueta !== undefined && (
              <Card variant="outlined" padding="lg">
                <CardBody>
                  <dl>
                    <div>
                      <dt className="text-on-surface-variant text-xs">Hito actual</dt>
                      <dd className="text-on-surface mt-1 text-base font-semibold">
                        {hito.etiqueta}
                      </dd>
                    </div>
                  </dl>
                </CardBody>
              </Card>
            )}
            <Card
              variant="outlined"
              padding="lg"
              className={hito.etiqueta === undefined ? 'xl:col-span-2' : undefined}
            >
              <CardBody>
                <dl>
                  <div>
                    <dt className="text-on-surface-variant text-xs">ETA estimado</dt>
                    <dd className="text-on-surface mt-1 text-base font-semibold">
                      {eta === undefined || eta === null ? (
                        <span className="text-on-surface-variant font-normal">Sin ETA</span>
                      ) : (
                        <>
                          {formatDateTime(eta.valor)}
                          {eta.obsoleto && (
                            <span className="text-warning ml-2 text-xs font-normal">
                              (obsoleto)
                            </span>
                          )}
                        </>
                      )}
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
          </div>

          <Card variant="outlined" padding="lg">
            <CardBody>
              <section aria-labelledby="incidencias" className="flex flex-col gap-3">
                <h2 id="incidencias" className="text-on-surface text-base font-semibold">
                  Incidencias
                </h2>
                {incidencias.length === 0 ? (
                  <p className="text-on-surface-variant flex items-center gap-2 text-sm">
                    <CircleCheck aria-hidden="true" className="size-4" />
                    <span>Sin incidencias reportadas.</span>
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {incidencias.map((incidencia, i) => (
                      <IncidenciaItem
                        key={`${incidencia.categoria}-${i}`}
                        incidencia={incidencia}
                      />
                    ))}
                  </ul>
                )}
              </section>
            </CardBody>
          </Card>
        </section>

        <section aria-labelledby="acciones" className="flex flex-col gap-4">
          <h2 id="acciones" className={CLASE_ROTULO_COLUMNA}>
            Acciones
          </h2>
          <CancelarRechazarPanel viaje={viaje} />

          {/* El panel es dueño de su propio estado de servidor (useEmergencias), por eso solo recibe el `viajeId`. */}
          <EmergenciaPanel viajeId={viaje.id} />
        </section>
      </div>

      {/*
        El enlace a "Bitacora" se desconectó con el recorte al contrato: la ruta
        /viajes/$viajeId/bitacora se retiró del enrutado (el contrato bff no define
        la bitácora). El componente se conserva en src/_desconectado/bitacora/.
      */}
    </div>
  );
}
