import { createFileRoute, Link } from '@tanstack/react-router';
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Viajes</h1>
        <Link
          to="/viajes/new"
          search={{ paso: 'servicio' }}
          className="bg-brand-600 hover:bg-brand-700 rounded-md px-3 py-2 text-sm font-medium text-white"
        >
          Solicitar servicio
        </Link>
      </div>
      <HistorialViajesSection viajes={viajes} />
    </div>
  );
}
