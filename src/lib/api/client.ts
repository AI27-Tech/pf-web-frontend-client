import { API_BASE_URL, API_PREFIX } from '../constants';
import { ApiError, kindFromStatus } from './errors';
import { refrescarSesionCoordinado } from './refreshCoordinator';
import { cortarSesion } from './sessionCut';
import { tokenStore } from './tokenStore';

export interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  readonly body?: unknown;
  readonly query?: Readonly<Record<string, string | number | undefined>>;
  readonly signal?: AbortSignal;
  /** Clave de idempotencia para comandos. La exige bff en los comandos atómicos. */
  readonly idempotencyKey?: string;
  /** Versión esperada del agregado: produce 409 si está obsoleta (P20). */
  readonly expectedVersion?: number;
  /** Control interno para limitar el reintento después de un refresco. */
  readonly _reintentoPostRefresco?: boolean;
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

function esEndpointDeSesion(path: string, method: RequestOptions['method']): boolean {
  return path === '/sesion' || (path === '/sesion/refresh' && method === 'POST');
}

function errorSesionFinalizada(): ApiError {
  return new ApiError('sesionFinalizada', 'La sesión finalizó.', 401, null);
}

async function manejar401<T>(path: string, options: RequestOptions): Promise<T> {
  if (options._reintentoPostRefresco) {
    cortarSesion();
    throw errorSesionFinalizada();
  }

  if (tokenStore.getRefreshToken() === null) {
    cortarSesion();
    throw errorSesionFinalizada();
  }

  try {
    await refrescarSesionCoordinado();
    return request<T>(path, { ...options, _reintentoPostRefresco: true });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      cortarSesion();
      throw errorSesionFinalizada();
    }
    // Red y 5xx son degradación transitoria: se propagan sin cortar la sesión.
    throw error;
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
    throw new ApiError(
      'degradado',
      'No se pudo alcanzar el servicio.',
      null,
      cause instanceof Error ? cause.message : null,
    );
  }

  if (response.status === 401 && !esEndpointDeSesion(path, method)) {
    return manejar401<T>(path, options);
  }

  if (!response.ok) {
    const detail = await readDetail(response);
    throw new ApiError(
      kindFromStatus(response.status),
      `${method} ${path} respondió ${response.status}`,
      response.status,
      detail,
    );
  }

  if (response.status === 204) return undefined as T;

  /*
   * Un comando puede responder OK SIN cuerpo (p. ej. `201` de `agregarNotaEmergencia`,
   * cuyo contrato no devuelve contenido). Antes de parsear JSON, se lee el texto: si
   * está vacío, la respuesta es un éxito sin cuerpo (`undefined`), no una respuesta
   * "rota". Solo se trata como `roto` un cuerpo NO vacío que no sea JSON válido.
   */
  const text = await response.text();
  if (text.length === 0) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch (cause) {
    throw new ApiError(
      'roto',
      'La respuesta no es JSON válido.',
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
