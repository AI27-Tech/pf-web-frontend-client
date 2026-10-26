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

export const API_PREFIX = '/api/v1';

/*
 * NOTA (E9-T10 / F-06): aqui vivian las constantes del transporte SSE
 * (`STREAM_BASE_URL`, `STREAM_ENABLED`, `STREAM_TIMINGS`) y la cadencia de polling
 * del seguimiento vivo (`POLLING_INTERVAL_MS`). Ese transporte es V2 y se retiro del
 * release path de V1; vive ahora en `prototipos-v2/seguimiento-vivo/`. El polling de
 * hitos/ETA de V1 (ADR 27) es una cadencia aun por fijar y no reutiliza estos valores.
 */

/*
 * Cadencia del polling HTTP del detalle/seguimiento del viaje (ADR 27).
 *
 * ADR 27 fija el transporte V1 de hitos/ETA/incidencias como pull inicial + polling
 * periodico por `bff`, y deja la frecuencia como CONFIGURACION TECNICA, no como regla
 * de producto.
 */
export const VIAJE_POLLING_INTERVAL_MS = 15_000;

/** Margen con el que se refresca la sesion antes de que el token expire. */
export const SESSION_REFRESH_MARGIN_MS = 60_000;

export const ETA_MAX_CHARS = 18;
