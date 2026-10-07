/*
 * Harness mínimo de router para las pruebas archivadas del prototipo.
 *
 * Copia local y simplificada de `tests/support/router.tsx` de V1: estas pruebas se
 * archivaron fuera del árbol que Vitest ejecuta (E9-T10 / F-06), así que no pueden
 * depender del harness de V1. Las tarjetas de "Viajes Activos" no montan `Link`, pero
 * se conserva el harness para fidelidad con la prueba original.
 */

import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';

export function renderConRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <>{ui}</>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}
