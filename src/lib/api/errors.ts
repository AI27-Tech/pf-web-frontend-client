/*
 * Taxonomia de errores del front-end.
 *
 * Es la contraparte cliente del modulo de adaptacion de errores de bff (apartado
 * (d)), y su distincion central es esta:
 *
 *   "Un dato ausente por degradacion no es un dato ausente. Un aguas-abajo caido
 *    nunca se presenta como no encontrado."
 *
 * De ahi que `degradado` y `noEncontrado` sean clases distintas y no un mismo
 * "error 4xx". Colapsarlas produce el mapa que miente.
 */

export type ApiErrorKind =
  /** 401/403. El token no alcanza, o la sesion ya no vale. */
  | 'noAutorizado'
  /** 404 real: el recurso no existe. NUNCA se usa para un aguas-abajo caido. */
  | 'noEncontrado'
  /** 409: comando obsoleto o carrera perdida. Se muestra, no se reintenta (P20). */
  | 'conflicto'
  /** 422: el comando no es valido. */
  | 'invalido'
  /** 503/504 y equivalentes: la dependencia no responde. Se degrada, no se miente. */
  | 'degradado'
  /** Todo lo demas, incluido fallo de red. */
  | 'roto';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly detail: string | null;

  constructor(kind: ApiErrorKind, message: string, status: number | null, detail: string | null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }

  /** True si el error significa "no lo sabemos ahora", no "no existe". */
  get esDegradacion(): boolean {
    return this.kind === 'degradado';
  }

  /** True si conviene reintentar. Un conflicto NO se reintenta solo (P20). */
  get esReintentable(): boolean {
    return this.kind === 'degradado' || this.kind === 'roto';
  }
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401 || status === 403) return 'noAutorizado';
  if (status === 404) return 'noEncontrado';
  if (status === 409) return 'conflicto';
  if (status === 422) return 'invalido';
  if (status === 503 || status === 504 || status === 502) return 'degradado';
  return 'roto';
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
