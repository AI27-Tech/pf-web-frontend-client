/*
 * Solicitar nuevo servicio — versión mínima apegada al contrato (E8-T3).
 *
 * El contrato `CrearViajeEntrada` acepta pocos campos; esta pantalla captura solo esos
 * y crea un viaje real. El asistente de 4 pasos se conservó en src/_desconectado/solicitud/
 * para reconectar cuando el contrato soporte sus campos.
 */

import { createFileRoute } from '@tanstack/react-router';
import { listCatalogo } from '@/lib/api/catalogos';
import { NuevaSolicitudForm } from '@/features/viajes/NuevaSolicitudForm';
import { ErrorState, Spinner } from '@/components/ui/Feedback';

export const Route = createFileRoute('/_private/viajes/new')({
  // Solo el catálogo que el contrato usa (tipo de servicio). El resto de catálogos del
  // asistente rico quedó con él en _desconectado/.
  loader: () => listCatalogo('tipos-servicio'),
  component: NuevoViajePage,
  pendingComponent: () => <Spinner label="Preparando el formulario" />,
  errorComponent: ({ error }) => <ErrorState error={error} />,
});

function NuevoViajePage() {
  const tiposServicio = Route.useLoaderData();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-on-surface text-2xl font-bold sm:text-3xl">Solicitar nuevo servicio</h1>
        <p className="text-on-surface-variant text-sm">
          Indica el origen, el destino y el tipo de servicio para crear una solicitud.
        </p>
      </header>
      <NuevaSolicitudForm tiposServicio={tiposServicio} />
    </div>
  );
}
