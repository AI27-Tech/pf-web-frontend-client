/*
 * La ruta `/seguimiento` ("Seguimiento en Vivo") — YA NO REGISTRADA.
 *
 * Era la pantalla que listaba "Viajes Activos" con su telemetría (velocidad,
 * temperatura, batería GPS), una barra de telemetría y un placeholder de mapa. Reusaba
 * `getPanel()` porque no tenía contrato ni endpoint propios.
 *
 * Toda esa superficie es seguimiento en vivo, que DEC-001 excluye de V1. Se retiró del
 * release path en E9-T10 / F-06. Lo que V1 sí muestra —viajes en curso con su estado y
 * su ETA (con marca de frescura)— vive en el Panel de Control (`/`) y en el Historial
 * de Viajes (`/viajes`), no aquí.
 *
 * PROTOTIPO V2 (NO productivo): no se compila, no se enruta, no entra en el bundle.
 */

import { createFileRoute } from '@tanstack/react-router';
import { getPanel } from '@/lib/api/panel';
import { ErrorState, Spinner } from '@/components/ui/Feedback';
import { SeguimientoSection } from './SeguimientoSection';

export const Route = createFileRoute('/_private/seguimiento/')({
  loader: () => getPanel(),
  component: SeguimientoPage,
  pendingComponent: () => <Spinner label="Cargando el seguimiento" />,
  errorComponent: ({ error }) => <ErrorState error={error} />,
});

function SeguimientoPage() {
  const panel = Route.useLoaderData();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:gap-6">
      <h1 className="text-on-surface text-2xl font-bold sm:text-3xl">Seguimiento en Vivo</h1>
      <SeguimientoSection viajes={panel.viajesEnCurso} />
    </div>
  );
}
