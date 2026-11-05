/*
 * Ayuda para probar componentes que consumen estado de servidor de TanStack Query.
 *
 * Un `useQuery`/`useMutation` necesita un `QueryClient` en contexto: sin él, el
 * componente lanza al montar. Este helper monta uno por render con la política mínima
 * para pruebas —sin reintentos— de modo que un fallo se observe en el PRIMER intento,
 * sin esperas por backoff.
 */

import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function QueryWrapper({ children }: { readonly children: ReactNode }) {
  return <QueryClientProvider client={makeTestQueryClient()}>{children}</QueryClientProvider>;
}

/** Render con un `QueryClient` fresco. Devuelve también el cliente por si hace falta. */
export function renderConQuery(ui: ReactElement) {
  const client = makeTestQueryClient();
  return {
    client,
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
  };
}
