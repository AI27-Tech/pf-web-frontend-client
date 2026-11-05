import { Outlet, createRootRoute } from '@tanstack/react-router';
import { ErrorState } from '@/components/ui/Feedback';

export const Route = createRootRoute({
  component: () => <Outlet />,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl p-6">
      <ErrorState error={error} />
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-lg font-semibold">Esta pagina no existe</h1>
    </div>
  ),
});
