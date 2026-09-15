/*
 * El chip de estado de un viaje.
 *
 * `lib/contracts/estados.ts` deja escrito que los estados de viaje
 * son datos del contrato. Hoy el unico estado que la documentacion
 * confirma es SOLICITADO.
 *
 */

import type { CondicionActiva, EstadoViaje } from '@/lib/contracts';
import { cx } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'info' | 'error' | 'neutral';

interface EstadoViajeChipProps {
  readonly estado: EstadoViaje;
  /** Condiciones superpuestas al estado. La primera manda sobre la apariencia. */
  readonly condicionesActivas?: readonly CondicionActiva[];
}

/** Relleno suave + su par `on-*`. El punto usa el tono solido del mismo rol. */
const toneClasses: Record<Tone, string> = {
  success: 'bg-success-container text-on-success-container',
  warning: 'bg-warning-container text-on-warning-container',
  info: 'bg-info-container text-on-info-container',
  error: 'bg-error-container text-on-error-container',
  neutral: 'bg-surface-container-high text-on-surface-variant',
};

const dotClasses: Record<Tone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  error: 'bg-error',
  neutral: 'bg-outline',
};

/** Etiquetas de los estados que el cliente conoce. Sin entrada por defecto. */
const labelByEstado: Readonly<Record<string, string>> = {
  SOLICITADO: 'Solicitado',
  EN_RUTA: 'En Ruta',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

function toneForEstado(estado: EstadoViaje): Tone {
  if (estado === 'EN_RUTA') return 'success';
  if (estado === 'SOLICITADO') return 'info';
  if (estado === 'COMPLETADO') return 'info';
  if (estado === 'CANCELADO') return 'error';
  return 'neutral';
}

export function EstadoViajeChip({ estado, condicionesActivas = [] }: EstadoViajeChipProps) {
  const condicion = condicionesActivas[0];

  const tone: Tone = condicion !== undefined ? 'warning' : toneForEstado(estado);
  const text = condicion?.descripcion ?? labelByEstado[estado] ?? estado;

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        toneClasses[tone],
      )}
    >
      <span aria-hidden="true" className={cx('size-1.5 shrink-0 rounded-full', dotClasses[tone])} />
      {text}
    </span>
  );
}
