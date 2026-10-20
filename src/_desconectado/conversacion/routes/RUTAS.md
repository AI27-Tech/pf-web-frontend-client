# Rutas de conversación (desconectadas)

Estas eran las dos rutas que vivían en `src/routes/_private/conversaciones/`. Se
retiraron del enrutado en el recorte al contrato (el `bff` no expone conversación al
cliente). Se conservan aquí como **referencia en texto** —no como `.tsx`— porque
`createFileRoute('/_private/conversaciones/...')` está ligado al route tree generado:
un archivo `.tsx` con ese id, fuera de `src/routes/`, no compilaría.

Reconectar: recrear estos dos archivos en `src/routes/_private/conversaciones/`,
repuntando los imports a la API y los componentes (hoy en `src/_desconectado/conversacion/`).

## `index.tsx` — lista

```tsx
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
```

## `$conversacionId.tsx` — detalle

```tsx
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
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['mensajes', conversacionId],
    queryFn: ({ signal }) => listMensajes(conversacionId, signal),
  });

  if (isPending) return <Spinner label="Cargando mensajes" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return <ConversacionSection conversacionId={conversacionId} mensajes={data} />;
}
```
