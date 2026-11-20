/*
 * PageProgress: la barra de carga general de la página.
 */
import { useRouterState } from '@tanstack/react-router';
import { ProgressBar } from '@ai27-tech/ui';

export function PageProgress() {
  const cargando = useRouterState({ select: (estado) => estado.status === 'pending' });
  if (!cargando) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-(--ui-z-popover)">
      <ProgressBar size="sm" label="Cargando página" />
    </div>
  );
}
