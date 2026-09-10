/*
 * LA PRUEBA DE CONTRATO. Es la razon de ser de este archivo de tests.
 *
 * Verifica la propiedad P4 del lado cliente: la misma entrada por la ruta pull y por
 * la ruta push produce el MISMO resultado. En el backend la garantia viene de que
 * `bff` y `procesamiento` comparten `packages/tracking-payload`; aqui viene de que
 * hay un solo parser y ninguna de las dos rutas tiene un camino propio.
 *
 * Si alguien anade un parser "de push", este test sigue pasando pero deja de decir
 * algo — asi que la otra mitad de la garantia es que no exista ese segundo parser.
 */

import { describe, expect, it } from 'vitest';
import { parseTrackingPayload, TrackingPayloadError } from '@/lib/tracking/parseTrackingPayload';
import {
  envolverEnSobre,
  wireCompleto,
  wireDegradado,
  wireSinDatos,
} from '../fixtures/trackingWire';

describe('parseTrackingPayload · no-deriva pull/push (P4)', () => {
  it('produce el mismo resultado por la ruta pull y por el sobre de push', () => {
    // Ruta pull: el cuerpo de GET /api/v1/viajes/{id}/tracking.
    const porPull = parseTrackingPayload(wireCompleto);

    // Ruta push: el mismo payload dentro de un sobre SSE.
    const sobre = envolverEnSobre(wireCompleto, 1042);
    const porPush = parseTrackingPayload(sobre.payload);

    expect(porPush).toStrictEqual(porPull);
  });

  it('el seq de transporte no contamina el resultado', () => {
    // Dos sobres con `seq` distinto y el mismo payload: misma salida.
    const primero = parseTrackingPayload(envolverEnSobre(wireCompleto, 1).payload);
    const segundo = parseTrackingPayload(envolverEnSobre(wireCompleto, 999_999).payload);

    expect(primero).toStrictEqual(segundo);
    // La secuencia que sale es la DE DOMINIO, no la del sobre.
    expect(primero.secuenciaDominio).toBe(42);
  });
});

describe('parseTrackingPayload · ausente por degradacion no es ausente', () => {
  it('preserva la marca de degradacion en lugar de colapsarla a null', () => {
    const payload = parseTrackingPayload(wireDegradado);

    expect(payload.posicion.estado).toBe('ausente-por-degradacion');
    if (payload.posicion.estado === 'ausente-por-degradacion') {
      expect(payload.posicion.motivo).toBe('procesamiento no disponible');
      expect(payload.posicion.ultimoDatoEn).toBe('2026-09-07T14:30:00Z');
    }
  });

  it('distingue degradacion de ausencia de dato', () => {
    const degradado = parseTrackingPayload(wireDegradado);
    const sinDatos = parseTrackingPayload(wireSinDatos);

    // Los dos "no tienen posicion", y son estados distintos. Colapsarlos es la mentira.
    expect(degradado.posicion.estado).toBe('ausente-por-degradacion');
    expect(sinDatos.posicion.estado).toBe('sin-dato');
    expect(degradado.posicion.estado).not.toBe(sinDatos.posicion.estado);
  });

  it('sirve el estado del viaje aunque posicion y ETA falten', () => {
    // El payload parcial sigue siendo util: estado si, posicion no.
    const payload = parseTrackingPayload(wireDegradado);
    expect(payload.estado).toBe('EN_RUTA');
  });
});

describe('parseTrackingPayload · forma invalida', () => {
  it('rechaza un payload que no es objeto', () => {
    expect(() => parseTrackingPayload('no soy un objeto')).toThrow(TrackingPayloadError);
  });

  it('rechaza un estado de frescura desconocido en lugar de adivinar', () => {
    const invalido = { ...wireCompleto, posicion: { estado: 'quiza' } };
    expect(() => parseTrackingPayload(invalido)).toThrow(TrackingPayloadError);
  });
});
