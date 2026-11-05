/*
 * Fixtures locales del prototipo de "Viajes Activos".
 *
 * Replican los tres constructores de `Fresco<Eta>` que V1 exporta desde
 * `src/lib/contracts`, para que estas pruebas archivadas no dependan del contrato de
 * V1. NO se ejecutan: Vitest no incluye `prototipos-v2/`.
 */

import type { ViajeEnCurso } from '../../features/viaje-activo';

type FrescoEta = ViajeEnCurso['eta'];

export function presente(estimadoEn: string): FrescoEta {
  return { estado: 'presente', valor: { objetivo: 'destino', estimadoEn } };
}

export function ausentePorDegradacion(): FrescoEta {
  return { estado: 'ausente-por-degradacion' };
}

export function sinDato(): FrescoEta {
  return { estado: 'sin-dato' };
}

export const viajeBase: ViajeEnCurso = {
  viajeId: 'viaje-1',
  folio: 'AI27-000101',
  origen: 'CDMX',
  destino: 'Monterrey',
  estado: 'EN_RUTA',
  condicionesActivas: [],
  eta: presente('2026-09-09T18:30:00Z'),
  operadorNombre: 'Carlos R.',
  progresoPct: 65,
  estadoSeguimiento: { etiqueta: 'Ruta Segura', tono: 'success', icono: 'ruta-segura' },
  velocidadPromedioKmh: 78,
  temperaturaCargaC: -4,
  bateriaGpsPct: 92,
};
