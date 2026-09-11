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

interface Presentacion {
  readonly icono: ReactNode;
  readonly texto: string;
  readonly clase: string;
}

function presentacion(reporte: ReporteSeguridad): Presentacion {
  switch (reporte) {
    case 'SIN_INCIDENCIAS':
      return {
        icono: <CircleCheck aria-hidden="true" className="size-5" />,
        texto: 'Sin incidencias',
        clase: 'bg-info-container text-info',
      };
    case 'CON_INCIDENCIAS':
      return {
        icono: <TriangleAlert aria-hidden="true" className="size-5" />,
        texto: 'Con incidencias',
        clase: 'bg-error-container text-error',
      };
    case 'PENDIENTE':
      return {
        icono: <CircleHelp aria-hidden="true" className="size-5" />,
        texto: 'Reporte pendiente',
        clase: 'bg-surface-container-high text-on-surface-variant',
      };
    default:
      // Union abierta: un valor desconocido se pinta en neutro con su codigo.
      return {
        icono: <CircleHelp aria-hidden="true" className="size-5" />,
        texto: reporte,
        clase: 'bg-surface-container-high text-on-surface-variant',
      };
  }
}

export function ReporteSeguridadCell({ reporte }: ReporteSeguridadCellProps) {
  const { icono, texto, clase } = presentacion(reporte);

  return (
    <span
      title={texto}
      className={cx('inline-flex size-8 items-center justify-center rounded-full', clase)}
    >
      {icono}
      <span className="sr-only">{texto}</span>
    </span>
  );
}
