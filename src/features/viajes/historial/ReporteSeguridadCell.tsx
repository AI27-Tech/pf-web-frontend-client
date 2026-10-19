/*
 * ReporteSeguridadCell: la celda "REPORTE SEGURIDAD" del Historial de Viajes.
 *
 * Un icono resume el resultado: check para "sin incidencias", triangulo para "con
 * incidencias", reloj neutro para "pendiente". El color y el icono no son los unicos
 * portadores del significado: cada estado lleva su texto en `sr-only` y en `title`,
 * asi que un lector de pantalla lo anuncia y el resto lo ve al pasar el cursor.
 *
 * `reporteSeguridad` es una union abierta: un valor que no conocemos cae en el caso
 * neutro con su propio codigo como texto, en vez de romper o fingir un resultado.
 */

import { CircleCheck, CircleHelp, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ReporteSeguridad } from '@/lib/contracts';
import { cx } from '@/lib/utils';

interface ReporteSeguridadCellProps {
  readonly reporte: ReporteSeguridad;
}

interface Presentation {
  readonly icon: ReactNode;
  readonly text: string;
  readonly className: string;
}

function presentation(reporte: ReporteSeguridad): Presentation {
  switch (reporte) {
    case 'SIN_INCIDENCIAS':
      return {
        icon: <CircleCheck aria-hidden="true" className="size-5" />,
        text: 'Sin incidencias',
        className: 'bg-info-container text-info',
      };
    case 'CON_INCIDENCIAS':
      return {
        icon: <TriangleAlert aria-hidden="true" className="size-5" />,
        text: 'Con incidencias',
        className: 'bg-error-container text-error',
      };
    case 'PENDIENTE':
      return {
        icon: <CircleHelp aria-hidden="true" className="size-5" />,
        text: 'Reporte pendiente',
        className: 'bg-surface-container-high text-on-surface-variant',
      };
    default:
      // Union abierta: un valor desconocido se pinta en neutro con su codigo.
      return {
        icon: <CircleHelp aria-hidden="true" className="size-5" />,
        text: reporte,
        className: 'bg-surface-container-high text-on-surface-variant',
      };
  }
}

export function ReporteSeguridadCell({ reporte }: ReporteSeguridadCellProps) {
  const { icon, text, className } = presentation(reporte);

  return (
    <span
      title={text}
      className={cx('inline-flex size-8 items-center justify-center rounded-full', className)}
    >
      {icon}
      <span className="sr-only">{text}</span>
    </span>
  );
}
