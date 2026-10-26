/*
 * ViajeDetailSection. Presentacional.
 *
 * Reconstruido sobre `ViajeSeguimiento` del contrato `bff` (recorte al contrato): la
 * vista del cliente es CURADA (DEC-006). Muestra el hito de progreso, el ETA estimado
 * con su marca de obsolescencia, y las incidencias curadas (categoría + estado +
 * marca de tiempo, y el impacto en el ETA si el contrato lo trae), nunca el tipo
 * interno de incidencia.
 *
 * Lo que el contrato NO expone aquí y por eso ya no se pinta: folio, origen, destino,
 * fecha de solicitud y "condiciones activas". Volverán si el contrato los publica.
 * Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */

import type { EstadoViaje, ViajeSeguimiento } from '@/lib/contracts';
import { formatDateTime } from '@/lib/utils';
import { EstadoViajeChip } from './EstadoViajeChip';

export function ViajeDetailSection({ viaje }: { readonly viaje: ViajeSeguimiento }) {
  const { hito, eta, incidencias } = viaje;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-on-surface text-xl font-semibold">Viaje {viaje.id}</h1>
        {/* El estado del hito es un token del enum del contrato (ADR 19). */}
        <EstadoViajeChip estado={hito.estado as EstadoViaje} />
      </header>

      <dl className="grid gap-4 sm:grid-cols-2">
        {hito.etiqueta !== undefined && (
          <div>
            <dt className="text-on-surface-variant text-xs font-medium">Hito</dt>
            <dd className="text-on-surface text-sm">{hito.etiqueta}</dd>
          </div>
        )}
        <div>
          <dt className="text-on-surface-variant text-xs font-medium">ETA estimado</dt>
          <dd className="text-on-surface text-sm">
            {eta === undefined || eta === null ? (
              <span className="text-on-surface-variant">Sin ETA</span>
            ) : (
              <>
                {formatDateTime(eta.valor)}
                {eta.obsoleto && (
                  <span className="text-degradado-800 ml-2 text-xs">(obsoleto)</span>
                )}
              </>
            )}
          </dd>
        </div>
      </dl>

      <section aria-labelledby="incidencias">
        <h2 id="incidencias" className="mb-2 text-sm font-semibold">
          Incidencias
        </h2>
        {incidencias.length === 0 ? (
          <p className="text-on-surface-variant text-sm">Sin incidencias reportadas.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {incidencias.map((incidencia, i) => (
              <li
                key={`${incidencia.categoria}-${i}`}
                className="bg-degradado-50 text-degradado-800 rounded-md px-3 py-2 text-sm"
              >
                <span className="font-medium">{incidencia.categoria}</span>{' '}
                <span className="text-xs">
                  · {incidencia.estado === 'en_atencion' ? 'En atención' : 'Resuelta'} ·{' '}
                  {formatDateTime(incidencia.marca_tiempo)}
                </span>
                {/* impacto_eta es opcional y nullable en el contrato.*/}
                {incidencia.impacto_eta !== undefined && incidencia.impacto_eta !== null && (
                  <span className="mt-1 block text-xs">
                    Impacto en el ETA: {incidencia.impacto_eta}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/*
        El enlace a "Bitacora" se desconectó con el recorte al contrato: la ruta
        /viajes/$viajeId/bitacora se retiró del enrutado (el contrato bff no define
        la bitácora). El componente se conserva en src/_desconectado/bitacora/.
      */}
    </div>
  );
}
