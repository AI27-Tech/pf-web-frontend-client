/*
 * Constantes de la app. Nada de URLs ni secretos aqui: las bases vienen de
 * variables de entorno, y este modulo solo las lee y valida.
 *
 * Acceso por PUNTO, nunca por corchetes: es lo unico que Vite sustituye de forma
 * estatica. Ver src/vite-env.d.ts para por que importa.
 */

function orEmpty(value: string | undefined): string {
  return typeof value === 'string' ? value : '';
}

/** bff: la unica superficie HTTP de comandos y consultas. */
export const API_BASE_URL = orEmpty(import.meta.env.VITE_API_BASE_URL);

/**
 * realtime: el stream SSE. NO pasa por bff, aunque este detras del mismo borde.
 * Vacio significa que la app corre en modo pull-only — que es tambien el estado
 * si ADR 10 decide que realtime no existe en V1.
 */
export const STREAM_BASE_URL = orEmpty(import.meta.env.VITE_STREAM_BASE_URL);

/** Si no hay stream configurado, no hay ruta push: todo es pull. */
export const STREAM_ENABLED = STREAM_BASE_URL.length > 0;

export const API_PREFIX = '/api/v1';

/*
 * Presupuestos del transporte SSE, fijados por el diseno (realtime, apartado (c)).
 * No son parametros de ergonomia: el latido es lo que impide el "mapa que miente",
 * porque TCP mantiene abierta una conexion muerta durante minutos.
 */
export const STREAM_TIMINGS = {
  /** El servidor emite latido con esta cadencia. */
  heartbeatMs: 4_000,
  /** Sin latido ni mensaje en esta ventana, la conexion se considera muerta. */
  livenessTimeoutMs: 7_000,
  /** Backoff inicial de reconexion, con jitter para no sincronizar la tormenta. */
  reconnectBaseMs: 500,
  reconnectMaxMs: 30_000,
} as const;

/**
 * Cadencia de la ruta de degradacion. Cuando el push no esta disponible, la
 * carga de push se convierte en carga de pull sobre bff — de ahi que no sea
 * agresiva.
 */
export const POLLING_INTERVAL_MS = 5_000;

/** Margen con el que se refresca la sesion antes de que el token expire. */
export const SESSION_REFRESH_MARGIN_MS = 60_000;

export const ETA_MAX_CHARS = 18;
