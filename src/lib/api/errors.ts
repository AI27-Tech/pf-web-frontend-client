/*
 * Taxonomia de errores del front-end.
 *
 * Un aguas-abajo caído (`degradado`) no es un "no encontrado" (`noEncontrado`).
 */

export type ApiErrorKind =
  /** 401/403. El token no alcanza, o la sesión aún no se ha clasificado como corte. */
  | 'noAutorizado'
  /** La sesión no pudo recuperarse y el portal ejecutó el corte. */
  | 'sesionFinalizada'
  /** 404 real: el recurso no existe. */
  | 'noEncontrado'
  /** 409: comando obsoleto o carrera perdida. */
  | 'conflicto'
  /** 422: el comando no es válido. */
  | 'invalido'
  /** 503/504 y equivalentes: la dependencia no responde. */
  | 'degradado'
  /** Todo lo demás, incluido fallo de red. */
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

  get esDegradacion(): boolean {
    return this.kind === 'degradado';
  }

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
