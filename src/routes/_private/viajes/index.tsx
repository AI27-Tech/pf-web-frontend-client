import { createFileRoute } from '@tanstack/react-router';
import { listViajes } from '@/lib/api/viajes';
import { HistorialViajesSection } from '@/features/viajes/historial/HistorialViajesSection';
import { ErrorState, Spinner } from '@/components/ui/Feedback';

export const Route = createFileRoute('/_private/viajes/')({
  loader: () => listViajes(),
  component: ViajesPage,
  pendingComponent: () => <Spinner label="Cargando viajes" />,
  errorComponent: ({ error }) => <ErrorState error={error} />,
});

function ViajesPage() {
  const viajes = Route.useLoaderData();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <HistorialViajesSection viajes={viajes} />
    </div>
  );
}
