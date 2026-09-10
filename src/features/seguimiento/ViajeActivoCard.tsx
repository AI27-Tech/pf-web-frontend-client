/*
 * Una tarjeta de "Viajes Activos" en Seguimiento en Vivo.
 *
 */

import type { ViajeEnCurso } from '@/lib/contracts';
import { formatEtaTexto } from '@/lib/tracking/formatEta';
import { cx } from '@/lib/utils';
import { EstadoSeguimientoBadge } from './EstadoSeguimientoBadge';
import { accentoDeRuta } from './rutaAccent';

interface ViajeActivoCardProps {
  readonly viaje: ViajeEnCurso;
  readonly indice: number;
  readonly seleccionada: boolean;
  readonly onSeleccionar: () => void;
}

/** Acota el progreso a 0–100. */
function progresoPctAcotado(progresoPct: number): number {
  return Math.min(100, Math.max(0, progresoPct));
}

function EtaTexto({ eta }: { readonly eta: ViajeEnCurso['eta'] }) {
  if (eta.estado === 'presente') {
    return (
      <span className="text-on-surface font-semibold">{formatEtaTexto(eta.valor.estimadoEn)}</span>
    );
  }

  if (eta.estado === 'ausente-por-degradacion') {
    return <span className="text-warning font-semibold">ETA no disponible</span>;
  }

  return <span className="text-on-surface-variant font-semibold">Pendiente</span>;
}

export function ViajeActivoCard({
  viaje,
  indice,
  seleccionada,
  onSeleccionar,
}: ViajeActivoCardProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onSeleccionar}
        aria-pressed={seleccionada}
        className={cx(
          'w-full rounded-md border-l-4 p-3 text-left transition-colors',
          accentoDeRuta(indice),
          seleccionada
            ? 'bg-surface-container-high'
            : 'bg-surface-container hover:bg-surface-container-high',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-on-surface-variant text-xs font-semibold">
            ID: <span className="text-on-surface">{viaje.folio}</span>
          </p>
          <EstadoSeguimientoBadge estadoSeguimiento={viaje.estadoSeguimiento} />
        </div>

        <p className="text-on-surface mt-1 text-sm font-bold">
          {viaje.origen} → {viaje.destino}
        </p>

        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-on-surface-variant font-semibold tracking-wide uppercase">
              Operador
            </p>
            <p className="text-on-surface">{viaje.operadorNombre}</p>
          </div>
          <div>
            <p className="text-on-surface-variant font-semibold tracking-wide uppercase">ETA</p>
            <EtaTexto eta={viaje.eta} />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <p className="text-on-surface-variant font-semibold tracking-wide uppercase">Progreso</p>
          <span className="text-on-surface font-semibold">
            {progresoPctAcotado(viaje.progresoPct)}%
          </span>
        </div>
      </button>
    </li>
  );
}
