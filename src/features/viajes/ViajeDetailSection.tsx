/*
 * ViajeDetailSection. Presentacional.
 *
 * Muestra el estado de progreso MAS las condiciones activas superpuestas (§C.2). Son
 * dos cosas distintas y se pintan por separado a proposito: una condicion activa no
 * sustituye al estado, se le superpone.
 */

import { Link } from '@tanstack/react-router';
import type { ViajeDetalle } from '@/lib/contracts';
import { formatDateTime } from '@/lib/utils';
import { EstadoViajeChip } from './EstadoViajeChip';

export function ViajeDetailSection({ viaje }: { readonly viaje: ViajeDetalle }) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-on-surface text-xl font-semibold">Viaje {viaje.folio}</h1>
        <EstadoViajeChip estado={viaje.estado} condicionesActivas={viaje.condicionesActivas} />
      </header>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-on-surface-variant text-xs font-medium">Origen</dt>
          <dd className="text-on-surface text-sm">{viaje.origen}</dd>
        </div>
        <div>
          <dt className="text-on-surface-variant text-xs font-medium">Destino</dt>
          <dd className="text-on-surface text-sm">{viaje.destino}</dd>
        </div>
        <div>
          <dt className="text-on-surface-variant text-xs font-medium">Solicitado</dt>
          <dd className="text-on-surface text-sm">{formatDateTime(viaje.solicitadoEn)}</dd>
        </div>
      </dl>

      {viaje.condicionesActivas.length > 0 && (
        <section aria-labelledby="condiciones">
          <h2 id="condiciones" className="mb-2 text-sm font-semibold">
            Condiciones activas
          </h2>
          <ul className="flex flex-col gap-2">
            {viaje.condicionesActivas.map((condicion) => (
              <li
                key={condicion.codigo}
                className="bg-degradado-50 text-degradado-800 rounded-md px-3 py-2 text-sm"
              >
                <span className="font-medium">{condicion.descripcion}</span>{' '}
                <span className="text-xs">desde {formatDateTime(condicion.desde)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="flex gap-3 text-sm">
        <Link
          to="/viajes/$viajeId/seguimiento"
          params={{ viajeId: viaje.id }}
          className="text-brand-700 hover:underline"
        >
          Seguimiento en vivo
        </Link>
        <Link
          to="/viajes/$viajeId/bitacora"
          params={{ viajeId: viaje.id }}
          className="text-brand-700 hover:underline"
        >
          Bitacora
        </Link>
      </nav>
    </div>
  );
}
