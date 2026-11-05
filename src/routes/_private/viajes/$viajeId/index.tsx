import { createFileRoute } from '@tanstack/react-router';
import { getViaje } from '@/lib/api/viajes';
import { ViajeDetailSection } from '@/features/viajes/ViajeDetailSection';
import { useViajeSeguimiento } from '@/features/viajes/useViajeSeguimiento';
import { ErrorState, Spinner } from '@/components/ui/Feedback';

/*
 * Detalle/seguimiento del viaje (E9-T5 / AI27-24, ADR 27).
 *
 * El `loader` hace la lectura INICIAL: es la puerta del primer render. Mientras resuelve
 * se muestra el `pendingComponent`, y si ese primer fetch falla lo atrapa el
 * `errorComponent` (pantalla completa, como corresponde a "nunca llego el dato").
 */
export const Route = createFileRoute('/_private/viajes/$viajeId/')({
  loader: ({ params }) => getViaje(params.viajeId),
  component: ViajeDetailPage,
  pendingComponent: () => <Spinner label="Cargando viaje" />,
  errorComponent: ({ error }) => <ErrorState error={error} />,
});

function ViajeDetailPage() {
  const { viajeId } = Route.useParams();
  const { data: viaje } = useViajeSeguimiento(viajeId, Route.useLoaderData());

  return <ViajeDetailSection viaje={viaje} />;
}
