/*
 * Filtro por estado del Historial, compartido por las rutas de viajes.
 *
 * El historial guarda su filtro en la URL (`/viajes?estado=CERRADO`). Para que el filtro
 * siga activo al moverse entre pantallas de viajes, el detalle y la conversación lo
 * reciben como search param opcional y lo reenvían en sus enlaces: así "Volver al
 * historial" regresa al mismo listado filtrado, incluso al entrar por un enlace directo.
 *
 * Un `estado` ausente o inválido significa "sin filtro" (todos).
 */

import { esEstadoViaje, type EstadoViaje } from '@/lib/contracts';

export interface FiltroEstadoSearch {
  readonly estado?: EstadoViaje;
}

/** `validateSearch` de las rutas que conservan el filtro del historial. */
export function validarFiltroEstado(search: Record<string, unknown>): FiltroEstadoSearch {
  return esEstadoViaje(search['estado']) ? { estado: search['estado'] } : {};
}

/**
 * Search param para un enlace que debe conservar el filtro: `{}` si no hay filtro, para
 * no ensuciar la URL con un `estado` vacío.
 */
export function conservarFiltro(estado: unknown): FiltroEstadoSearch {
  return esEstadoViaje(estado) ? { estado } : {};
}
