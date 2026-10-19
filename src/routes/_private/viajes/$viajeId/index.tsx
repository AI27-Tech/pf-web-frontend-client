import { createFileRoute } from '@tanstack/react-router';
import { getViaje } from '@/lib/api/viajes';
import { ViajeDetailSection } from '@/features/viajes/ViajeDetailSection';
import { ErrorState, Spinner } from '@/components/ui/Feedback';

export const Route = createFileRoute('/_private/viajes/$viajeId/')({
  loader: ({ params }) => getViaje(params.viajeId),
  component: ViajeDetailPage,
  pendingComponent: () => <Spinner label="Cargando viaje" />,
  errorComponent: ({ error }) => <ErrorState error={error} />,
});

function ViajeDetailPage() {
  return <ViajeDetailSection viaje={Route.useLoaderData()} />;
}
