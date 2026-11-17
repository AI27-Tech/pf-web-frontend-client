/*
 * Estados del viaje en los que se puede activar una emergencia: el recorrido, es decir
 * EN_TRANSITO y el bucle de paradas EN_DESTINO y EN_DESCARGA (ADR 19, DEC-013).
 * EN_EMBARQUE queda fuera: es previo al recorrido. Misma regla que aplica el `bff`.
 */
import { EstadoViaje } from '@/lib/contracts';

const ESTADOS_CON_EMERGENCIA: readonly string[] = [
  EstadoViaje.EnTransito,
  EstadoViaje.EnDestino,
  EstadoViaje.EnDescarga,
];

export function admiteEmergencia(estado: string): boolean {
  return ESTADOS_CON_EMERGENCIA.includes(estado);
}
