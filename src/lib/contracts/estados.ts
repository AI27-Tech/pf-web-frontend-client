/*
 * Estados de viaje — reexportados del contrato generado.
 *
 * Los estados son "dato único" (P14, ADR 19): se generan desde el contrato
 * (`@ai27-tech/contracts/estados`), no se declaran a mano en cada servicio. Este
 * archivo solo reexporta el enum del contrato para que el resto de la app lo use
 * a través del barrel, sin importar directamente del paquete generado.
 *
 * `EstadoViaje` es ahora una unión CERRADA de los 13 estados canónicos. Un estado
 * inventado deja de compilar — que es justo la señal que antes faltaba.
 */

export {
  EstadoViaje,
  ESTADOS_VIAJE,
  esTerminal,
  puedeTransicionar,
} from '@ai27-tech/contracts/estados';

import { ESTADOS_VIAJE, type EstadoViaje } from '@ai27-tech/contracts/estados';

/** Estado inicial de una solicitud de servicio (§C.1, ADR 19). */
export const ESTADO_INICIAL = 'SOLICITADO' as const;

export function esEstadoViaje(value: unknown): value is EstadoViaje {
  return typeof value === 'string' && (ESTADOS_VIAJE as readonly string[]).includes(value);
}
