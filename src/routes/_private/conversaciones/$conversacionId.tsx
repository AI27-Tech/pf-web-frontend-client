import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { listMensajes } from '@/lib/api/conversaciones';
import { ConversacionSection } from '@/features/conversacion/ConversacionSection';
import { ErrorState, Spinner } from '@/components/ui/Feedback';

export const Route = createFileRoute('/_private/conversaciones/$conversacionId')({
  component: ConversacionPage,
});

function ConversacionPage() {
  const { conversacionId } = Route.useParams();

  /*
   * Con useQuery en lugar de loader porque el composer invalida esta clave al enviar,
   * y la cache de Query es lo que hace que ese refresco sea un cambio de una linea.
   *
   * TODO(realtime): suscribir tambien `canalConversacion(conversacionId)` para recibir
   * `mensaje.creado` por push. La historia seguira ordenandose por secuencia de dominio.
   */
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['mensajes', conversacionId],
    queryFn: ({ signal }) => listMensajes(conversacionId, signal),
  });

  if (isPending) return <Spinner label="Cargando mensajes" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return <ConversacionSection conversacionId={conversacionId} mensajes={data} />;
}
