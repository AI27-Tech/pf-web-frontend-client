/*
 * QueryClient. Es el dueno de TODO el estado de servidor de la app.
 *
 * La politica de reintento codifica la taxonomia de errores: un `conflicto` (409) no
 * se reintenta —el comando esta obsoleto y quien decide es el usuario (P20)—, y un
 * `noAutorizado` tampoco, porque reintentar no arregla un claim insuficiente. Solo
 * se reintenta lo que puede resolverse esperando: degradado y roto.
 */

import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/lib/api/errors';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (isApiError(error) && !error.esReintentable) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        // Un comando no se reintenta solo: puede no ser idempotente.
        retry: false,
      },
    },
  });
}
