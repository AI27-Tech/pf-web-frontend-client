import { createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import { ErrorState, Spinner } from '@/components/ui/Feedback';

export const router = createRouter({
  routeTree,
  defaultPendingComponent: () => <Spinner />,
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
