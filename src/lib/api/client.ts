/*
 * Wrapper base de fetch contra `bff`.
 *
 * bff es la UNICA superficie HTTP de comandos y consultas que este front-end
 * consume: no hablamos con `operacion`, `catalogos`, `mensajeria` ni `identidad`
 * directamente. Si aparece aqui una base URL que no sea la de bff —con la unica
 * excepcion del stream de `realtime`, que tiene su propio modulo— algo se torcio.
 *
 * Lo que este modulo NO hace, deliberadamente:
 *   - No decide autorizacion. El tenant, el rol y la Audiencia se derivan del token
 *     en el servidor; el cliente no los envia ni los interpreta (P10).
 *   - No filtra por audiencia. Si un dato llego, el servidor decidio que podia llegar.
 */

import { API_BASE_URL, API_PREFIX } from '../constants';
import { ApiError, kindFromStatus } from './errors';
import { tokenStore } from './tokenStore';

export interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  readonly body?: unknown;
  readonly query?: Readonly<Record<string, string | number | undefined>>;
  readonly signal?: AbortSignal;
  /** Clave de idempotencia para comandos. La exige bff en los comandos atomicos. */
  readonly idempotencyKey?: string;
  /** Version esperada del agregado: produce 409 si esta obsoleta (P20). */
  readonly expectedVersion?: number;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_PREFIX}${path}`, API_BASE_URL || globalThis.location.origin);

  if (query !== undefined) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function readDetail(response: Response): Promise<string | null> {
  try {
    const text = await response.text();
    return text.length > 0 ? text.slice(0, 500) : null;
  } catch {
    return null;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal, idempotencyKey, expectedVersion } = options;

  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) headers.set('Content-Type', 'application/json');

  const token = tokenStore.getAccessToken();
  if (token !== null) headers.set('Authorization', `Bearer ${token}`);

  if (idempotencyKey !== undefined) headers.set('Idempotency-Key', idempotencyKey);
  if (expectedVersion !== undefined) headers.set('If-Match', String(expectedVersion));

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...(signal !== undefined ? { signal } : {}),
    });
  } catch (cause) {
    // Fallo de red: es degradacion, no "no encontrado".
    throw new ApiError(
      'degradado',
      'No se pudo alcanzar el servicio.',
      null,
      cause instanceof Error ? cause.message : null,
    );
  }

  if (!response.ok) {
    const detail = await readDetail(response);
    throw new ApiError(
      kindFromStatus(response.status),
      `${method} ${path} respondio ${response.status}`,
      response.status,
      detail,
    );
  }

  if (response.status === 204) return undefined as T;

  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new ApiError(
      'roto',
      'La respuesta no es JSON valido.',
      response.status,
      cause instanceof Error ? cause.message : null,
    );
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),

  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
