import { createFileRoute } from '@tanstack/react-router';
import { listConversaciones } from '@/lib/api/conversaciones';
import { ConversacionesListSection } from '@/features/conversacion/ConversacionesListSection';
import { ErrorState, Spinner } from '@/components/ui/Feedback';

export const Route = createFileRoute('/_private/conversaciones/')({
  loader: () => listConversaciones(),
  component: ConversacionesPage,
  pendingComponent: () => <Spinner label="Cargando conversaciones" />,
  errorComponent: ({ error }) => <ErrorState error={error} />,
});

function ConversacionesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Mensajes</h1>
      <ConversacionesListSection conversaciones={Route.useLoaderData()} />
    </div>
  );
}
