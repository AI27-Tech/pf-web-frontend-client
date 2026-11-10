import { createFileRoute } from '@tanstack/react-router';
import { listViajes } from '@/lib/api/viajes';
import { HistorialViajesSection } from '@/features/viajes/historial/HistorialViajesSection';
import { ErrorState, Spinner } from '@/components/ui/Feedback';
import { validarFiltroEstado } from '@/features/viajes/filtroEstado';

/*
 * Search params de la ruta. El unico filtro que el contrato `bff` (listarViajes)
 * soporta hoy es `estado`; por eso es el unico que vive en la URL. Un `estado`
 * invalido o ausente = sin filtro (todos), siguiendo el patron de `login.tsx`:
 * la ruta valida su propio search param y descarta lo que no reconoce. La validacion
 * se comparte con el detalle y la conversacion, que lo conservan para poder volver.
 */
export const Route = createFileRoute('/_private/viajes/')({
  validateSearch: validarFiltroEstado,
  // El loader depende del search param: cuando `estado` cambia, TanStack Router
  // vuelve a ejecutar el loader con el nuevo valor y bff devuelve la pagina ya
  // filtrada. El filtrado es del SERVIDOR, no del navegador.
  loaderDeps: ({ search }) => ({ estado: search.estado }),
  loader: ({ deps }) => listViajes(deps.estado !== undefined ? { estado: deps.estado } : {}),
  component: ViajesPage,
  pendingComponent: () => <Spinner label="Cargando viajes" />,
  errorComponent: ({ error }) => <ErrorState error={error} />,
});

function ViajesPage() {
  const viajes = Route.useLoaderData();
  const { estado } = Route.useSearch();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <HistorialViajesSection viajes={viajes} estado={estado} />
    </div>
  );
}
