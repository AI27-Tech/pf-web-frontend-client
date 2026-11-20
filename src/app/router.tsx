import { createRouter } from '@tanstack/react-router';
import { SkeletonCard } from '@ai27-tech/ui';
import { routeTree } from '@/routeTree.gen';
import { ErrorState } from '@/components/ui/ErrorState';

export const router = createRouter({
  routeTree,
  defaultPendingComponent: () => <SkeletonCard lines={4} />,
  defaultPendingMs: 150,
  defaultErrorComponent: ({ error }) => <ErrorState error={error} />,
  // Sin datos precargados por hover: el usuario paga las peticiones que provoca.
  defaultPreload: false,
});

// Registra los tipos del arbol de rutas para que params y search sean tipados.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
