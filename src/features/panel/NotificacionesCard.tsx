/*
 * Notificaciones Recientes
 */

import { CircleAlert, Info } from 'lucide-react';
import type { NotificacionPanel, SeveridadNotificacion } from '@/lib/contracts';
import { Card } from '@/components/ui/Card';
import { cx, formatDateTime, formatRelativeTime } from '@/lib/utils';

interface NotificacionesCardProps {
  readonly notificaciones: readonly NotificacionPanel[];
}

interface EstiloSeveridad {
  /** Palabra que un lector de pantalla lee antes del titulo. */
  readonly label: string;
  readonly container: string;
  readonly border: string;
  readonly icon: typeof Info;
}

/**
 * Estilos por severidad conocida. Sin entrada por defecto: una severidad que no
 * conocemos cae en `SEVERIDAD_DESCONOCIDA` y se pinta en neutro, en lugar de
 * disfrazarse de informativa — que seria decidir por el backend que algo no es grave.
 */
const porSeveridad: Readonly<Record<string, EstiloSeveridad>> = {
  critica: {
    label: 'Critica',
    container: 'bg-error-container text-on-error-container',
    border: 'border-error',
    icon: CircleAlert,
  },
  informativa: {
    label: 'Informativa',
    container: 'bg-info-container text-on-info-container',
    border: 'border-info',
    icon: Info,
  },
};

const SEVERIDAD_DESCONOCIDA: EstiloSeveridad = {
  label: 'Aviso',
  container: 'bg-surface-container text-on-surface-variant',
  border: 'border-outline',
  icon: Info,
};

function estiloDe(severidad: SeveridadNotificacion): EstiloSeveridad {
  return porSeveridad[severidad] ?? SEVERIDAD_DESCONOCIDA;
}

function NotificacionItem({ notificacion }: { readonly notificacion: NotificacionPanel }) {
  const estilo = estiloDe(notificacion.severidad);
  const Icon = estilo.icon;

  return (
    <li className={cx('flex gap-3 rounded-md border-l-4 p-3', estilo.container, estilo.border)}>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />

      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-semibold">
          <span className="sr-only">{estilo.label}: </span>
          {notificacion.titulo}
        </p>
        <p className="text-xs">{notificacion.cuerpo}</p>
        <time
          dateTime={notificacion.ocurrioEn}
          title={formatDateTime(notificacion.ocurrioEn)}
          className="text-xs opacity-80"
        >
          {formatRelativeTime(notificacion.ocurrioEn)}
        </time>
      </div>
    </li>
  );
}

export function NotificacionesCard({ notificaciones }: NotificacionesCardProps) {
  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-6">
      <h2 className="text-on-surface text-lg font-bold">Notificaciones Recientes</h2>

      {notificaciones.length === 0 ? (
        <p className="text-on-surface-variant text-sm">No hay notificaciones recientes.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notificaciones.map((notificacion) => (
            <NotificacionItem key={notificacion.id} notificacion={notificacion} />
          ))}
        </ul>
      )}
    </Card>
  );
}
