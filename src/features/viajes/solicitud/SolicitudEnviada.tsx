/*
 * Pantalla de confirmación — "Solicitud enviada".
 *
 * Es el cierre del flujo, no una ruta nueva: el wizard la muestra cuando `paso` es
 * `enviada`. No hay backend, asi que el ID es simulado y NO identifica un registro
 * real. "Ver solicitud" queda inerte (no hay detalle que abrir todavia) y "Volver al
 * inicio" reinicia el borrador y regresa al primer paso.
 */

import { CalendarDays, CheckCircle2, Clock, Route } from 'lucide-react';
import type { BorradorSolicitud } from '@/lib/contracts';
import { Button, Card, CardBody } from '@ai27-tech/ui';

interface SolicitudEnviadaProps {
  readonly id: string;
  readonly borrador: BorradorSolicitud;
  readonly onVolverAlInicio: () => void;
}

const NO_DATA = 'No especificado';

function orFallback(value: string): string {
  return value.trim() !== '' ? value : NO_DATA;
}

function formatDate(iso: string): string {
  if (iso === '') return NO_DATA;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function SolicitudEnviada({ id, borrador, onVolverAlInicio }: SolicitudEnviadaProps) {
  const origen = orFallback(borrador.origen.nombreLugar || borrador.origen.ciudadEstado);
  const destino = orFallback(borrador.destino.nombreLugar || borrador.destino.ciudadEstado);

  return (
    <Card
      variant="outlined"
      padding="lg"
      className="mx-auto w-full max-w-xl"
      aria-label="Solicitud enviada"
    >
      <CardBody className="flex flex-col items-center gap-5 text-center">
        <span className="bg-primary text-on-primary flex size-14 items-center justify-center rounded-full">
          <CheckCircle2 aria-hidden="true" className="size-8" />
        </span>

        <h2 className="text-on-surface text-2xl font-bold">Solicitud enviada</h2>

        <p className="text-on-surface-variant text-sm">
          ID de Solicitud:{' '}
          <span className="text-primary bg-surface-container rounded px-2 py-0.5 font-semibold">
            {id}
          </span>
        </p>

        <p className="text-on-surface-variant max-w-md text-sm">
          AI27 está revisando los detalles de tu solicitud para asignar los recursos necesarios.
          Recibirás una notificación en cuanto el servicio sea confirmado.
        </p>

        <div className="bg-surface-container w-full rounded-lg p-4 text-left">
          <p className="text-on-surface-variant mb-3 text-xs font-semibold tracking-wide uppercase">
            Detalles de la Solicitud
          </p>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <dt className="text-on-surface-variant flex items-center gap-1 text-xs font-medium">
                <Route aria-hidden="true" className="size-3.5" />
                Ruta
              </dt>
              <dd className="text-on-surface text-sm">
                {origen} → {destino}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-on-surface-variant flex items-center gap-1 text-xs font-medium">
                <CalendarDays aria-hidden="true" className="size-3.5" />
                Fecha
              </dt>
              <dd className="text-on-surface text-sm">
                {formatDate(borrador.servicio.fechaSalida)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-on-surface-variant flex items-center gap-1 text-xs font-medium">
                <Clock aria-hidden="true" className="size-3.5" />
                Hora
              </dt>
              <dd className="text-on-surface text-sm">
                {orFallback(borrador.servicio.horaSalida)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Inerte: no hay detalle de solicitud que abrir mientras no exista backend. */}
          <Button variant="primary">Ver solicitud</Button>
          <Button variant="secondary" onClick={onVolverAlInicio}>
            Volver al inicio
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
