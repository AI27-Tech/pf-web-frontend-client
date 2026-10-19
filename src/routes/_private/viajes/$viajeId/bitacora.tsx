import { createFileRoute } from '@tanstack/react-router';
import { getBitacora } from '@/lib/api/viajes';
import { BitacoraSection } from '@/features/viajes/BitacoraSection';
import { ErrorState, Spinner } from '@/components/ui/Feedback';

export const Route = createFileRoute('/_private/viajes/$viajeId/bitacora')({
  loader: ({ params }) => getBitacora(params.viajeId),
  component: BitacoraPage,
  pendingComponent: () => <Spinner label="Cargando bitacora" />,
  errorComponent: ({ error }) => <ErrorState error={error} />,
});

function BitacoraPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Bitacora</h1>
      <BitacoraSection entradas={Route.useLoaderData()} />
    </div>
  );
}
