/*
 * Lectores de la forma de contrato ("wire"). Estructurales, no de dominio.
 *
 * Existen para que haya UNA sola implementacion de "leer un campo marcado". La regla
 * "ausente por degradacion no es ausente" se cumple o se rompe en `parseFrescoWire`,
 * y esa funcion la comparten el parser de tracking y el del panel: si cada parser
 * escribiera su propia version, la regla se cumpliria dos veces y se romperia una.
 *
 * Este modulo no conoce viajes, ni ETAs, ni posiciones. Solo sabe de estructura:
 * "esto tiene que ser un string", "esto puede venir marcado como ausente". Los
 * parsers de dominio construyen encima.
 *
 * TODO(contracts): los nombres de campo del wire (`estado`, `valor`, `observado_en`,
 * `motivo`, `ultimo_dato_en`) son SUPOSICIONES. docs/arquitectura/ fija el requisito
 * de que la ausencia viaje marcada, no su serializacion. Confirmar contra
 * contracts/openapi/bff.yaml cuando exista.
 */

import type { Fresco } from '../contracts';
import { ausentePorDegradacion, presente, sinDato } from '../contracts';

/**
 * Error de forma del wire. Es 'roto', no 'degradado': el contrato no cuadra.
 *
 * Cada parser de dominio lo traduce a su propio error para no filtrar el detalle de
 * este modulo — ver `TrackingPayloadError` y `PanelPayloadError`.
 */
export class WireError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WireError';
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Exige un objeto. `contexto` describe QUE se estaba leyendo, para el mensaje. */
export function requireRecord(value: unknown, contexto: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new WireError(`Se esperaba un objeto en ${contexto}`);
  }
  return value;
}

export function requireString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  if (typeof value !== 'string') {
    throw new WireError(`Se esperaba string en "${key}"`);
  }
  return value;
}

export function requireNumber(source: Record<string, unknown>, key: string): number {
  const value = source[key];
  if (typeof value !== 'number') {
    throw new WireError(`Se esperaba number en "${key}"`);
  }
  return value;
}

export function optionalNumber(source: Record<string, unknown>, key: string): number | null {
  const value = source[key];
  return typeof value === 'number' ? value : null;
}

/**
 * Lee un campo que el servidor puede marcar como ausente por degradacion.
 *
 * La forma del wire distingue tres casos, y los tres importan:
 *   { estado: 'presente', valor: {...}, observado_en: '...' }
 *   { estado: 'ausente_por_degradacion', motivo: '...', ultimo_dato_en: '...' | null }
 *   ausente del objeto, o null  -> nunca hubo dato
 *
 * Un `estado` que no reconoce es un error, no un `sin-dato`: adivinar aqui es
 * exactamente como se cuela la mentira que `Fresco` existe para impedir.
 */
export function parseFrescoWire<T>(
  raw: unknown,
  parseValor: (value: Record<string, unknown>) => T,
): Fresco<T> {
  if (raw === undefined || raw === null) return sinDato<T>();

  if (!isRecord(raw)) {
    throw new WireError('Campo marcado con forma invalida');
  }

  const estado = raw['estado'];

  if (estado === 'ausente_por_degradacion') {
    const ultimoDatoEn = raw['ultimo_dato_en'];
    return ausentePorDegradacion<T>(
      typeof raw['motivo'] === 'string' ? raw['motivo'] : 'dependencia no disponible',
      typeof ultimoDatoEn === 'string' ? ultimoDatoEn : null,
    );
  }

  if (estado === 'presente') {
    const valor = raw['valor'];
    if (!isRecord(valor)) {
      throw new WireError('Campo presente sin valor');
    }
    return presente(parseValor(valor), requireString(raw, 'observado_en'));
  }

  throw new WireError(`Estado de frescura desconocido: ${String(estado)}`);
}
