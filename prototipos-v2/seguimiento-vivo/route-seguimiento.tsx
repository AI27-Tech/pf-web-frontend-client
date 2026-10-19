/*
 * La ruta de seguimiento. Es la unica de la app que usa las DOS rutas de datos, y por
 * eso su carga la lleva `useSeguimiento` y no un `loader`: el loader trae un valor una
 * vez, y aqui el valor se actualiza por stream despues de la carga inicial.
 *
 * Sigue sin haber fetch en el componente: el fetch esta en el hook del dominio, con la
 * cache de TanStack Query como unico almacen. No hay useEffect + useState trayendo datos.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useSeguimiento } from '@/features/seguimiento/useSeguimiento';
import { SeguimientoDetalleSection } from '@/features/seguimiento/SeguimientoDetalleSection';
import { ErrorState, Spinner } from '@/components/ui/Feedback';

export const Route = createFileRoute('/_private/viajes/$viajeId/seguimiento')({
  component: SeguimientoPage,
});

function SeguimientoPage() {
  const { viajeId } = Route.useParams();
  const { data, isPending, isError, error, refetch } = useSeguimiento(viajeId);

  if (isPending) return <Spinner label="Cargando seguimiento" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return <SeguimientoDetalleSection payload={data} />;
}
