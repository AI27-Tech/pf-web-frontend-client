/*
 * Viajes y tracking, contra `bff`.
 *
 * El listado va con alcance de tenant, y ese alcance lo deriva bff del claim del
 * token — nunca de un parametro que mandemos nosotros (P9, P10). Si alguna vez
 * aparece aqui un `tenantId` en la query, es un bug de seguridad, no una feature.
 */

import { api } from './client';
import type { EntradaBitacora, SolicitudViaje, TrackingPayload, ViajeDetalle } from '../contracts';
import type { ViajeResumen } from '../contracts';
import { parseTrackingPayload } from '../tracking/parseTrackingPayload';

export async function listViajes(signal?: AbortSignal): Promise<readonly ViajeResumen[]> {
  return api.get<readonly ViajeResumen[]>('/viajes', signal !== undefined ? { signal } : {});
}

export async function getViaje(viajeId: string, signal?: AbortSignal): Promise<ViajeDetalle> {
  return api.get<ViajeDetalle>(`/viajes/${viajeId}`, signal !== undefined ? { signal } : {});
}

/** Entra en SOLICITADO (§C.1). El estado inicial no lo elige el cliente. */
export async function solicitarViaje(solicitud: SolicitudViaje): Promise<{ readonly id: string }> {
  return api.post<{ readonly id: string }>('/viajes', solicitud);
}

/**
 * LA RUTA PULL. Es a la vez la carga inicial y la ruta de degradacion.
 *
 * Devuelve `TrackingPayload` porque pasa por el parser unico: es la misma salida que
 * produce el handler del stream con el payload del sobre (P4).
 */
export async function getTracking(viajeId: string, signal?: AbortSignal): Promise<TrackingPayload> {
  const raw = await api.get<unknown>(
    `/viajes/${viajeId}/tracking`,
    signal !== undefined ? { signal } : {},
  );
  return parseTrackingPayload(raw);
}

export async function getBitacora(
  viajeId: string,
  signal?: AbortSignal,
): Promise<readonly EntradaBitacora[]> {
  return api.get<readonly EntradaBitacora[]>(
    `/viajes/${viajeId}/bitacora`,
    signal !== undefined ? { signal } : {},
  );
}
