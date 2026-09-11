/*
 * Panel de Control. La home de la sesion autenticada.
 *
 * El fetch va en el `loader`, no en el componente: es la frontera de la ruta.
 * `pendingComponent` y `errorComponent` sustituyen a los estados de carga y error
 * escritos a mano — son el equivalente de loading.tsx / error.tsx.
 *
 * El listado completo de viajes sigue viviendo en `/viajes`: esta pantalla muestra
 * solo los que estan en curso, que es una vista distinta y no una version recortada.
 */

import { createFileRoute } from '@tanstack/react-router';
import { getPanel } from '@/lib/api/panel';
import { PanelSection } from '@/features/panel/PanelSection';
import { ErrorState, Spinner } from '@/components/ui/Feedback';

export const Route = createFileRoute('/_private/')({
  loader: () => getPanel(),
  component: PanelPage,
  pendingComponent: () => <Spinner label="Cargando el panel" />,
  errorComponent: ({ error }) => <ErrorState error={error} />,
});

function PanelPage() {
  const panel = Route.useLoaderData();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:gap-6">
      <h1 className="text-on-surface text-2xl font-bold sm:text-3xl">Panel de Control</h1>
      <PanelSection panel={panel} />
    </div>
  );
}
