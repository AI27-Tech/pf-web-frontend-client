/*
 * PROVISIONAL — se reemplaza por generacion desde contracts/. Ver README.
 *
 * La forma del payload de tracking. UNA sola, para las dos rutas de datos.
 *
 * Es la propiedad P4: la misma entrada por `GET /viajes/{id}/tracking` (pull) y por
 * el sobre de push produce bytes identicos, porque en el backend las dos rutas
 * consumen la misma biblioteca pura `packages/tracking-payload`. Del lado cliente,
 * la contraparte de esa propiedad es que haya un solo parser — ver
 * `src/lib/tracking/parseTrackingPayload.ts`.
 *
 * No declares aqui una variante "de push" ni una "de pull". Si aparece una segunda
 * forma, la deriva que P4 prohibe ya ocurrio.
 */

import type { CondicionActiva, EstadoViaje } from './estados';
import type { Fresco } from './freshness';
import type { DomainSeq } from './sequences';

export interface Posicion {
  readonly lat: number;
  readonly lon: number;
  /** Grados, si la fuente lo reporta. */
  readonly rumbo: number | null;
  readonly velocidadKmh: number | null;
}

/**
 * ETA del viaje.
 *
 * TODO(ADR 4): la politica de colchon del ETA de cliente esta ABIERTA. El diseno
 * distingue dos numeros —el calculado y el que se muestra al cliente, `eta_cliente`,
 * que es contra el que se mide el SLA— y todavia no esta decidido cual cruza la
 * frontera. Esta interfaz modela solo el que se muestra: cuando ADR 4 cierre,
 * puede hacer falta anadir el otro y distinguirlos explicitamente.
 */
export interface Eta {
  readonly objetivo: string;
  readonly estimadoEn: string;
}

export interface EventoGeocerca {
  readonly id: string;
  readonly zona: string;
  readonly tipo: 'entrada' | 'salida';
  readonly ocurrioEn: string;
}

/** Lo que el mapa y el panel de seguimiento consumen. Una sola forma. */
export interface TrackingPayload {
  readonly viajeId: string;
  readonly estado: EstadoViaje;
  readonly condicionesActivas: readonly CondicionActiva[];

  /*
   * Estos dos vienen de `procesamiento`. Si `procesamiento` esta caido, bff sirve
   * el payload PARCIAL Y MARCADO: estado si, posicion y ETA ausentes con marca
   * explicita. De ahi que sean `Fresco<T>` y no `T | null`.
   */
  readonly posicion: Fresco<Posicion>;
  readonly eta: Fresco<Eta>;

  readonly geocercas: readonly EventoGeocerca[];

  /** Secuencia DE DOMINIO. Nunca el `seq` del sobre. */
  readonly secuenciaDominio: DomainSeq;
}
