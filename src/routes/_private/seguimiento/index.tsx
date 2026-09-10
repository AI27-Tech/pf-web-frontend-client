/*
 * Seguimiento en Vivo.
 *
 * Misma frontera de datos que el Panel de Control: `loader` con `getPanel()`,
 * `pendingComponent` y `errorComponent` en vez de estados de carga escritos a mano.
 * No hay un contrato ni un endpoint propios de esta pantalla.
 */

import { createFileRoute } from '@tanstack/react-router';
import { getPanel } from '@/lib/api/panel';
import { SeguimientoSection } from '@/features/seguimiento/SeguimientoSection';
import { ErrorState, Spinner } from '@/components/ui/Feedback';

export const Route = createFileRoute('/_private/seguimiento/')({
  loader: () => getPanel(),
  component: SeguimientoPage,
  pendingComponent: () => <Spinner label="Cargando el seguimiento" />,
  errorComponent: ({ error }) => <ErrorState error={error} />,
});

function SeguimientoPage() {
  const panel = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <h1 className="text-on-surface text-2xl font-bold sm:text-3xl">Seguimiento en Vivo</h1>
      <SeguimientoSection viajes={panel.viajesEnCurso} />
    </div>
  );
}
