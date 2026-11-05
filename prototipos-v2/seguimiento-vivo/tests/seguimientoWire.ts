/*
 * Fixtures del payload de seguimiento en su forma de contrato ("wire").
 *
 * PROVISIONAL: los nombres de campo son los que asume
 * `src/lib/seguimiento/parseSeguimientoPayload.ts`, y NO estan confirmados por
 * contracts/openapi/bff.yaml — que no existe todavia. La documentacion fija el
 * requisito (la ausencia por degradacion "viaja marcada"), no la serializacion.
 *
 * TODO(contracts): sustituir por ejemplos tomados del contrato real.
 */

export const wireCompleto = {
  viaje_id: '7f3a1c00-0000-4000-8000-000000000001',
  estado: 'EN_RUTA',
  condiciones_activas: [
    { codigo: 'DEMORA_ADUANA', descripcion: 'Demora en aduana', desde: '2026-09-07T13:00:00Z' },
  ],
  posicion: {
    estado: 'presente',
    observado_en: '2026-09-07T14:32:11Z',
    valor: { lat: 19.4326, lon: -99.1332, rumbo: 180, velocidad_kmh: 82 },
  },
  eta: {
    estado: 'presente',
    observado_en: '2026-09-07T14:32:11Z',
    valor: { objetivo: 'destino', estimado_en: '2026-09-07T18:10:00Z' },
  },
  geocercas: [
    {
      id: 'g-1',
      zona: 'Patio Queretaro',
      tipo: 'salida',
      ocurrio_en: '2026-09-07T11:05:00Z',
    },
  ],
  secuencia_dominio: 42,
} as const;

/**
 * El caso que de verdad importa: `procesamiento` esta caido, asi que bff sirve el
 * payload PARCIAL Y MARCADO. Estado si, posicion y ETA ausentes CON marca.
 */
export const wireDegradado = {
  viaje_id: '7f3a1c00-0000-4000-8000-000000000001',
  estado: 'EN_RUTA',
  condiciones_activas: [],
  posicion: {
    estado: 'ausente_por_degradacion',
    motivo: 'procesamiento no disponible',
    ultimo_dato_en: '2026-09-07T14:30:00Z',
  },
  eta: {
    estado: 'ausente_por_degradacion',
    motivo: 'procesamiento no disponible',
    ultimo_dato_en: null,
  },
  geocercas: [],
  secuencia_dominio: 43,
} as const;

/** Un viaje recien solicitado: nunca hubo posicion. Distinto de degradado. */
export const wireSinDatos = {
  viaje_id: '7f3a1c00-0000-4000-8000-000000000002',
  estado: 'SOLICITADO',
  condiciones_activas: [],
  posicion: null,
  eta: null,
  geocercas: [],
  secuencia_dominio: 1,
} as const;

/**
 * El MISMO payload, envuelto en un sobre SSE.
 *
 * El sobre anade metadatos de TRANSPORTE —`seq`, prioridad, TTL, dedup_key— que no
 * pertenecen al dominio. El parser recibe unicamente `payload`, y ahi esta la clave
 * de que las dos rutas produzcan el mismo resultado.
 */
export function envolverEnSobre(payload: unknown, transportSeq: number) {
  return {
    seq: transportSeq,
    tipo: 'posicion.actualizada',
    prioridad: 'baja',
    ttl_seg: 30,
    dedup_key: 'posicion:7f3a1c:9c2104',
    ts: '2026-09-07T14:32:11Z',
    payload,
  };
}
