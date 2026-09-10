/*
 * EL parser unico del payload de tracking.
 *
 * Esta es la contraparte cliente de la propiedad P4. En el backend, `bff` (ruta
 * pull) y `procesamiento` (ruta push) consumen la MISMA biblioteca pura
 * `packages/tracking-payload`, asi que las dos rutas producen bytes identicos.
 * Del lado cliente, la obligacion equivalente es que haya un solo parser.
 *
 * Reglas de este modulo, y no son estilisticas:
 *
 *   1. Es PURO. Sin fetch, sin estado, sin reloj, sin acceso al DOM. Es lo que lo
 *      hace testeable con las mismas fixtures por las dos rutas.
 *   2. No sabe si el dato llego por pull o por push, y NO debe saberlo. Si aparece
 *      un parametro `origen: 'pull' | 'push'`, la deriva que P4 prohibe ya empezo.
 *   3. La ausencia por degradacion se PRESERVA como tal. Nunca la colapsa a null,
 *      nunca la rellena con el ultimo valor conocido, nunca interpola.
 *
 * El punto 3 es el que impide el "mapa que miente": un marcador interpolado sobre
 * una posicion de hace 35 segundos es exactamente lo que el diseno declara peor que
 * un mapa que se calla.
 *
 * La lectura estructural del wire —incluida la del campo marcado— vive en
 * `lib/wire/readers.ts` porque el panel de control la necesita identica. Los
 * parsers de valor de ESTE dominio (posicion, ETA, condiciones) se exportan desde
 * aqui por la misma razon: una sola implementacion por forma.
 */

import type {
  CondicionActiva,
  Eta,
  EventoGeocerca,
  Fresco,
  Posicion,
  TrackingPayload,
} from '../contracts';
import { toDomainSeq } from '../contracts';
import {
  WireError,
  isRecord,
  optionalNumber,
  parseFrescoWire,
  requireNumber,
  requireString,
} from '../wire/readers';

/** Error de forma del payload. Es 'roto', no 'degradado': el contrato no cuadra. */
export class TrackingPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TrackingPayloadError';
  }
}

export function parsePosicionWire(value: Record<string, unknown>): Posicion {
  return {
    lat: requireNumber(value, 'lat'),
    lon: requireNumber(value, 'lon'),
    rumbo: optionalNumber(value, 'rumbo'),
    velocidadKmh: optionalNumber(value, 'velocidad_kmh'),
  };
}

export function parseEtaWire(value: Record<string, unknown>): Eta {
  // TODO(ADR 4): cuando cierre la politica de colchon, revisar si cruzan dos
  // numeros de ETA en lugar de uno y si hay que distinguirlos aqui.
  return {
    objetivo: requireString(value, 'objetivo'),
    estimadoEn: requireString(value, 'estimado_en'),
  };
}

/** Las condiciones activas se superponen al estado de progreso (§C.2). */
export function parseCondicionesWire(raw: unknown): readonly CondicionActiva[] {
  if (!Array.isArray(raw)) return [];

  return raw.filter(isRecord).map((item) => ({
    codigo: requireString(item, 'codigo'),
    descripcion: requireString(item, 'descripcion'),
    desde: requireString(item, 'desde'),
  }));
}

function parseGeocercas(raw: unknown): readonly EventoGeocerca[] {
  if (!Array.isArray(raw)) return [];

  return raw.filter(isRecord).map((item) => {
    const tipo = item['tipo'];
    if (tipo !== 'entrada' && tipo !== 'salida') {
      throw new WireError(`Tipo de evento de geocerca invalido: ${String(tipo)}`);
    }
    return {
      id: requireString(item, 'id'),
      zona: requireString(item, 'zona'),
      tipo,
      ocurrioEn: requireString(item, 'ocurrio_en'),
    };
  });
}

function parseEtaFresco(raw: unknown): Fresco<Eta> {
  return parseFrescoWire(raw, parseEtaWire);
}

/**
 * Convierte la forma del contrato en el modelo de la app.
 *
 * Lo llaman las DOS rutas de datos:
 *   - el loader de la ruta, con el cuerpo de GET /api/v1/viajes/{id}/tracking
 *   - el handler del stream, con el `payload` del sobre SSE
 *
 * Misma entrada, misma salida. La prueba de contrato en tests/ lo verifica.
 *
 * Los fallos estructurales de `lib/wire/` se traducen a `TrackingPayloadError`: quien
 * llama a este modulo trata con el error de este modulo, no con el detalle de como
 * esta implementada la lectura por dentro.
 */
export function parseTrackingPayload(raw: unknown): TrackingPayload {
  try {
    if (!isRecord(raw)) {
      throw new TrackingPayloadError('El payload de tracking no es un objeto');
    }

    return {
      viajeId: requireString(raw, 'viaje_id'),
      estado: requireString(raw, 'estado'),
      condicionesActivas: parseCondicionesWire(raw['condiciones_activas']),
      posicion: parseFrescoWire(raw['posicion'], parsePosicionWire),
      eta: parseEtaFresco(raw['eta']),
      geocercas: parseGeocercas(raw['geocercas']),
      // Secuencia DE DOMINIO. El `seq` del sobre no entra aqui y no debe entrar (P5).
      secuenciaDominio: toDomainSeq(requireNumber(raw, 'secuencia_dominio')),
    };
  } catch (cause) {
    if (cause instanceof WireError) {
      throw new TrackingPayloadError(cause.message);
    }
    throw cause;
  }
}
