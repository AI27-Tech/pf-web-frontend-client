/*
 * Viajes y seguimiento, contra `bff`.
 *
 * El listado va con alcance de tenant, y ese alcance lo deriva bff del claim del
 * token — nunca de un parametro que mandemos nosotros (P9, P10). Si alguna vez
 * aparece aqui un `tenantId` en la query, es un bug de seguridad, no una feature.
 */

import { api } from './client';
import type { EntradaBitacora, SolicitudViaje, ViajeDetalle } from '../contracts';
import type { ViajeResumen } from '../contracts';

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

/*
 * NOTA (E9-T10 / F-06): aqui vivia `getSeguimiento`, la ruta pull de
 * `GET /viajes/{id}/tracking`. Ese endpoint es V2 y NO aparece en el tracer (ver
 * contracts/openapi/bff.yaml). El seguimiento vivo —posicion, senal, stream— quedo
 * aislado del release path de V1 en `prototipos-v2/seguimiento-vivo/`. El ETA
 * estimado de V1 (E2-HU-012) no se lee por aqui: viaja en el panel y en el detalle
 * del viaje.
 */

export async function getBitacora(
  viajeId: string,
  signal?: AbortSignal,
): Promise<readonly EntradaBitacora[]> {
  return api.get<readonly EntradaBitacora[]>(
    `/viajes/${viajeId}/bitacora`,
    signal !== undefined ? { signal } : {},
  );
}
