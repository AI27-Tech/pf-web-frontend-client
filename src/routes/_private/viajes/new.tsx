/*
 * Solicitar nuevo servicio.
 *
 * Aqui se lee el search param `?paso=` que decide que paso se muestra.
 */

import { useCallback } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { listCatalogo } from '@/lib/api/catalogos';
import { SolicitarServicioWizard } from '@/features/viajes/solicitud/SolicitarServicioWizard';
import { esPasoValido, type PasoSolicitud } from '@/features/viajes/solicitud/pasos';
import { ErrorState, Spinner } from '@/components/ui/Feedback';

export const Route = createFileRoute('/_private/viajes/new')({
  // El search param del paso, acotado a los valores validos; por defecto, el primero.
  validateSearch: (search: Record<string, unknown>): { paso: PasoSolicitud } => ({
    paso: esPasoValido(search['paso']) ? search['paso'] : 'servicio',
  }),
  loader: async () => {
    // Los cinco catalogos que usan los pasos, en paralelo. bff los sirve de su cache.
    const [tiposServicio, prioridades, categorias, rangosValor, requisitos] = await Promise.all([
      listCatalogo('tipos-servicio'),
      listCatalogo('prioridades-servicio'),
      listCatalogo('categorias-carga'),
      listCatalogo('rangos-valor'),
      listCatalogo('requisitos-manejo'),
    ]);
    return { tiposServicio, prioridades, categorias, rangosValor, requisitos };
  },
  component: NuevoViajePage,
  pendingComponent: () => <Spinner label="Preparando el formulario" />,
  errorComponent: ({ error }) => <ErrorState error={error} />,
});

function NuevoViajePage() {
  const { paso } = Route.useSearch();
  const catalogos = Route.useLoaderData();
  const navigate = useNavigate();

  const navegarAPaso = useCallback(
    (destino: PasoSolicitud): void => {
      void navigate({ to: '/viajes/new', search: { paso: destino } });
    },
    [navigate],
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-on-surface text-2xl font-bold sm:text-3xl">Solicitar nuevo servicio</h1>
        <p className="text-on-surface-variant text-sm">
          Complete los detalles para iniciar una nueva solicitud de protección logística.
        </p>
      </header>
      <SolicitarServicioWizard paso={paso} navegarAPaso={navegarAPaso} catalogos={catalogos} />
    </div>
  );
}
