import { Outlet, createRootRoute } from '@tanstack/react-router';
import { EmptyState } from '@ai27-tech/ui';
import { FileQuestion } from 'lucide-react';
import { PageProgress } from '@/app/shell/PageProgress';
import { ErrorState } from '@/components/ui/ErrorState';

export const Route = createRootRoute({
  component: () => (
    <>
      <PageProgress />
      <Outlet />
    </>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl p-6">
      <ErrorState error={error} />
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl p-6">
      <EmptyState
        icon={<FileQuestion />}
        title="Esta página no existe"
        description="Revisa el enlace o vuelve a tu historial de viajes."
      />
    </div>
  ),
});
