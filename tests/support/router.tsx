/*
 * Ayuda para probar componentes que contienen `Link` de TanStack Router.
 *
 * Un `Link` no funciona sin router: necesita el contexto para resolver el destino y
 * para saber si esta activo. Montar un router de memoria es la alternativa honesta a
 * mockear el `Link`, porque comprueba lo que de verdad importa —que el destino existe
 * y que resuelve al `href` esperado— en lugar de comprobar que le pasamos una prop.
 *
 * Las rutas de este arbol son de mentira y solo existen para que la navegacion tenga
 * a donde ir. Los `to` de los componentes se siguen validando contra el arbol REAL,
 * porque el tipo de `to` viene de `src/routeTree.gen.ts` por augmentacion de modulo.
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

/** Destinos que los componentes del panel enlazan. Ampliar cuando aparezcan mas. */
const RUTAS_DE_PRUEBA = ['/viajes', '/viajes/new', '/viajes/$viajeId'] as const;

export function renderConRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <>{ui}</>,
  });

  const destinos = RUTAS_DE_PRUEBA.map((path) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      component: () => <p>Destino {path}</p>,
    }),
  );

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, ...destinos]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  return render(<RouterProvider router={router} />);
}
