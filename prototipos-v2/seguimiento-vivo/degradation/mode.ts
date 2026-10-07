/*
 * La conmutacion push -> polling.
 *
 * Es la bandera de degradacion de §B.4: cuando `realtime` no esta disponible, el
 * cliente pasa a polling contra `GET /api/v1/viajes/{id}/tracking`, "con el mismo
 * parser y el mismo contrato".
 *
 * La frase importante es "el mismo parser": esto NO es una ruta de codigo alterna.
 * Cambia de donde llegan los bytes; no cambia como se leen, ni que se muestra, ni
 * que tipos se usan. Si el modo de degradacion acaba teniendo su propio parser o
 * su propio componente, la deriva que P4 prohibe ya ocurrio.
 *
 * Nota de carga: la carga de push se convierte en carga de pull sobre bff, y esa
 * proporcion es una senal de escalamiento del lado servidor. De ahi que el
 * intervalo de polling sea prudente y no agresivo.
 */

import type { StreamStatus } from '../stream/streamClient';

export type DataPathMode =
  /** El stream esta entregando. */
  | 'push'
  /** El stream no esta disponible o no recibe: se consulta la ruta pull. */
  | 'polling';

export interface DegradationState {
  readonly mode: DataPathMode;
  readonly streamStatus: StreamStatus;
  /** Texto para la UI. Se MUESTRA: el usuario tiene derecho a saber que ve. */
  readonly reason: string | null;
}

export const initialDegradationState: DegradationState = {
  mode: 'polling',
  streamStatus: 'inactivo',
  reason: null,
};

/**
 * Deriva el modo de la ruta de datos del estado del stream.
 *
 * `vivo-sin-datos` degrada a polling aunque el socket este sano: es exactamente el
 * caso peligroso —el latido sigue, asi que el cliente CREE que esta al dia— y la
 * respuesta correcta es ir a buscar el dato, no confiar en el silencio.
 */
export function deriveDegradation(streamStatus: StreamStatus): DegradationState {
  switch (streamStatus) {
    case 'abierto':
      return { mode: 'push', streamStatus, reason: null };

    case 'vivo-sin-datos':
      return {
        mode: 'polling',
        streamStatus,
        reason: 'El seguimiento en vivo esta conectado pero no esta recibiendo novedades.',
      };

    case 'conectando':
    case 'reconectando':
      return {
        mode: 'polling',
        streamStatus,
        reason: 'Reconectando el seguimiento en vivo.',
      };

    case 'caido':
      return {
        mode: 'polling',
        streamStatus,
        reason:
          'El seguimiento en vivo no esta disponible. Los datos se actualizan periodicamente.',
      };

    case 'inactivo':
      return { mode: 'polling', streamStatus, reason: null };
  }
}

/** True si la UI debe mostrar el aviso de degradacion. Callarse si, mentir no. */
export function shouldWarnUser(state: DegradationState): boolean {
  return state.reason !== null;
}
