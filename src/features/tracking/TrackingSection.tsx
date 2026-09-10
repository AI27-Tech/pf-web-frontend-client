/*
 * TrackingSection. Presentacional: recibe un `TrackingPayload` y lo pinta.
 *
 * No sabe si el payload llego por pull o por push, y esa ignorancia es la propiedad
 * que hay que preservar. Si algun dia este componente necesita saberlo para decidir
 * que mostrar, la deriva que P4 prohibe ya ocurrio.
 *
 * Cada dato degradable pasa por FreshnessMark, que es lo que impide colapsar
 * "no lo sabemos ahora" en "no hay".
 */

import type { TrackingPayload } from '@/lib/contracts';
import { FreshnessMark } from '@/components/ui/FreshnessMark';
import { formatDateTime } from '@/lib/utils';
import { TrackingMap } from './TrackingMap';

export function TrackingSection({ payload }: { readonly payload: TrackingPayload }) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-xl font-semibold">Seguimiento</h1>
        <span className="bg-brand-50 text-brand-700 rounded-full px-2.5 py-1 text-xs font-medium">
          {payload.estado}
        </span>
      </header>

      <TrackingMap posicion={payload.posicion} />

      <div className="grid gap-6 sm:grid-cols-2">
        <section aria-labelledby="posicion-heading">
          <h2 id="posicion-heading" className="mb-2 text-sm font-semibold">
            Posicion
          </h2>
          <FreshnessMark
            dato={payload.posicion}
            etiqueta="posicion"
            umbralAntiguedadSeg={30}
            render={(posicion) => (
              <p className="text-sm">
                {posicion.lat.toFixed(5)}, {posicion.lon.toFixed(5)}
                {posicion.velocidadKmh !== null && ` · ${posicion.velocidadKmh} km/h`}
              </p>
            )}
          />
        </section>

        <section aria-labelledby="eta-heading">
          <h2 id="eta-heading" className="mb-2 text-sm font-semibold">
            Llegada estimada
          </h2>
          <FreshnessMark
            dato={payload.eta}
            etiqueta="estimacion de llegada"
            umbralAntiguedadSeg={120}
            render={(eta) => (
              <p className="text-sm">
                {eta.objetivo}: {formatDateTime(eta.estimadoEn)}
              </p>
            )}
          />
        </section>
      </div>

      {payload.condicionesActivas.length > 0 && (
        <section aria-labelledby="condiciones-tracking">
          <h2 id="condiciones-tracking" className="mb-2 text-sm font-semibold">
            Condiciones activas
          </h2>
          <ul className="flex flex-col gap-2">
            {payload.condicionesActivas.map((condicion) => (
              <li
                key={condicion.codigo}
                className="bg-degradado-50 text-degradado-800 rounded-md px-3 py-2 text-sm"
              >
                {condicion.descripcion}
              </li>
            ))}
          </ul>
        </section>
      )}

      {payload.geocercas.length > 0 && (
        <section aria-labelledby="geocercas">
          <h2 id="geocercas" className="mb-2 text-sm font-semibold">
            Eventos de geocerca
          </h2>
          <ul className="flex flex-col gap-1 text-sm">
            {/* Un evento de geocerca NUNCA se deduplica: cada uno es unico. */}
            {payload.geocercas.map((evento) => (
              <li key={evento.id}>
                {evento.tipo === 'entrada' ? 'Entrada a' : 'Salida de'} {evento.zona} ·{' '}
                {formatDateTime(evento.ocurrioEn)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
