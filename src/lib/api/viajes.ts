/*
 * Viajes y seguimiento, contra `bff`.
 *
 * El listado va con alcance de tenant, y ese alcance lo deriva bff del claim del
 * token — nunca de un parametro que mandemos nosotros (P9, P10). Si alguna vez
 * aparece aqui un `tenantId` en la query, es un bug de seguridad, no una feature.
 */

import { api } from './client';
import type {
  CrearViajeEntrada,
  EstadoViaje,
  TransicionEntrada,
  ViajeSeguimiento,
} from '../contracts';
import type { ViajeResumen } from '../contracts';

/**
 * Las dos aristas que el cliente puede pedir sobre SU viaje (E1-HU-002, DEC-005/DEC-111):
 *   - `CANCELADO`: ya no quiere el servicio (antes de la salida).
 *   - `RECHAZADO_POR_CLIENTE`: no acepta el servicio asignado.
 * Cualquier otra arista la rechaza `operacion` (no es parte del carril del cliente).
 */
export type EstadoDestinoCliente = Extract<EstadoViaje, 'CANCELADO' | 'RECHAZADO_POR_CLIENTE'>;

/**
 * Filtro del listado. Hoy el contrato `bff` (listarViajes) solo acepta `estado`
 * (string) y `cursor`: no hay busqueda de texto ni rango de fechas. Por eso el
 * filtro es exactamente `estado?`, y nada mas. `tenantId` NO va aqui: el alcance
 * lo deriva bff del token (P9, P10); mandarlo seria un bug de seguridad.
 */
export interface ListViajesFiltro {
  readonly estado?: EstadoViaje;
}

export async function listViajes(
  filtro: ListViajesFiltro = {},
  signal?: AbortSignal,
): Promise<readonly ViajeResumen[]> {
  // `estado` vacio/ausente = todos: no se manda el query param y bff devuelve el
  // listado completo del alcance. El filtrado lo hace el SERVIDOR, no el navegador.
  return api.get<readonly ViajeResumen[]>('/viajes', {
    ...(filtro.estado !== undefined ? { query: { estado: filtro.estado } } : {}),
    ...(signal !== undefined ? { signal } : {}),
  });
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

/**
 * Cancela o rechaza un viaje (audiencia cliente, E1-HU-002 / E9-T7, AI27-26).
 *
 * `POST /viajes/{id}/transiciones-cliente` con `TransicionEntrada = { a_estado, causa }`.
 * El cliente solo puede pedir `CANCELADO` o `RECHAZADO_POR_CLIENTE` (lo fija el tipo
 * `EstadoDestinoCliente`); la máquina de estados y el aislamiento por tenant los valida
 * `operacion`, no el navegador (DEC-005/DEC-111). `causa` (el motivo) es OBLIGATORIA en
 * ambas acciones: la UI la exige antes de habilitar el botón, pero aquí también se manda
 * siempre porque el servidor responde 400 sin ella.
 *
 * Devuelve `ViajeSeguimiento` —la MISMA vista curada que `getViaje`—, ya con el viaje
 * actualizado. Por eso el llamante NO hace un segundo GET: siembra esa respuesta en la
 * query `['viaje', viajeId]` (DEC-006: nunca el estado canónico ni las condiciones).
 */
export async function transicionarViajeCliente(
  viajeId: string,
  aEstado: EstadoDestinoCliente,
  causa: string,
): Promise<ViajeSeguimiento> {
  const entrada: TransicionEntrada = { a_estado: aEstado, causa };
  return api.post<ViajeSeguimiento>(`/viajes/${viajeId}/transiciones-cliente`, entrada);
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
