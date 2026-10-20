/*
 * Viajes y seguimiento, contra `bff`.
 *
 * El listado va con alcance de tenant, y ese alcance lo deriva bff del claim del
 * token — nunca de un parametro que mandemos nosotros (P9, P10). Si alguna vez
 * aparece aqui un `tenantId` en la query, es un bug de seguridad, no una feature.
 */

import { api } from './client';
import type { CrearViajeEntrada, ViajeSeguimiento } from '../contracts';
import type { ViajeResumen } from '../contracts';

export async function listViajes(signal?: AbortSignal): Promise<readonly ViajeResumen[]> {
  return api.get<readonly ViajeResumen[]>('/viajes', signal !== undefined ? { signal } : {});
}

/** Detalle/seguimiento del viaje: hito, ETA e incidencias curadas (ViajeSeguimiento). */
export async function getViaje(viajeId: string, signal?: AbortSignal): Promise<ViajeSeguimiento> {
  return api.get<ViajeSeguimiento>(`/viajes/${viajeId}`, signal !== undefined ? { signal } : {});
}

/**
 * Crea un viaje con la forma del contrato (CrearViajeEntrada). Entra en SOLICITADO
 * (§C.1): el estado inicial lo fija el servidor, no el cliente. Devuelve el resumen
 * del viaje creado (ViajeResumen del contrato).
 */
export async function crearViaje(entrada: CrearViajeEntrada): Promise<ViajeResumen> {
  return api.post<ViajeResumen>('/viajes', entrada);
}

/*
 * NOTA (E9-T10 / F-06): aqui vivia `getSeguimiento`, la ruta pull de
 * `GET /viajes/{id}/tracking`. Ese endpoint es V2 y NO aparece en el tracer (ver
 * contracts/openapi/bff.yaml). El seguimiento vivo —posicion, senal, stream— quedo
 * aislado del release path de V1 en `prototipos-v2/seguimiento-vivo/`. El ETA
 * estimado de V1 (E2-HU-012) no se lee por aqui: viaja en el panel y en el detalle
 * del viaje.
 *
 * NOTA (recorte al contrato): `getBitacora` se desconectó: el contrato bff no define
 * `GET /viajes/{id}/bitacora`. Su versión conservada vive junto al componente en
 * `src/_desconectado/bitacora/`. Ver docs/decisiones/2026-recorte-al-contrato-bff.md.
 */
