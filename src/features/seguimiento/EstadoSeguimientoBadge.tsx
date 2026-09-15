/*
 * El badge de estado de seguimiento de una tarjeta de "Viajes Activos".
 *
 * `estadoSeguimiento` ya trae su tono e icono desde el wire este componente no decide nada,
 * solo traduce esos dos valores a clases y a un icono de `lucide-react`. Un tono o icono
 * que la UI no reconoce cae en un valor neutro en lugar de romper.
 */

import { CircleCheck, MapPin, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { EstadoSeguimiento } from '@/lib/contracts';
import { cx } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'info' | 'neutral';

function knownTone(tono: EstadoSeguimiento['tono']): Tone {
  if (tono === 'success') return 'success';
  if (tono === 'warning') return 'warning';
  if (tono === 'info') return 'info';
  return 'neutral';
}

const iconByKey: Readonly<Record<string, LucideIcon>> = {
  'ruta-segura': CircleCheck,
  'desvio-detectado': TriangleAlert,
  'en-transito': MapPin,
};

const textClasses: Record<Tone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  neutral: 'text-on-surface-variant',
};

export function EstadoSeguimientoBadge({
  estadoSeguimiento,
}: {
  readonly estadoSeguimiento: EstadoSeguimiento;
}) {
  const tone = knownTone(estadoSeguimiento.tono);
  const Icon = iconByKey[estadoSeguimiento.icono] ?? MapPin;

  return (
    <span
      className={cx('inline-flex items-center gap-1.5 text-xs font-semibold', textClasses[tone])}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {estadoSeguimiento.etiqueta}
    </span>
  );
}
