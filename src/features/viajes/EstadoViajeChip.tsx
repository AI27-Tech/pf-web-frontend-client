/*
 * El chip de estado de un viaje.
 *
 * Los estados son los del contrato generado (`@ai27-tech/contracts/estados`, ADR 19):
 * unión cerrada de 13 valores. El chip mapea cada estado a la señal táctica del
 * `Badge` de `@ai27-tech/ui`.
 *
 * Las condiciones superpuestas (incidencia, sin señal) NO viajan en `ViajeResumen`
 * del contrato; se reconcilian en el detalle del viaje (`ViajeSeguimiento.incidencias`)
 * en su propio paso. Por eso este chip pinta solo el estado.
 */

import { Badge, type BadgeVariant } from '@ai27-tech/ui';
import type { EstadoViaje } from '@/lib/contracts';

interface EstadoViajeChipProps {
  readonly estado: EstadoViaje;
}

/** Etiqueta legible por estado del contrato. Sin entrada = se muestra el token crudo. */
const labelByEstado: Readonly<Record<string, string>> = {
  SOLICITADO: 'Solicitado',
  APROBADO: 'Aprobado',
  RECHAZADO_POR_AI27: 'Rechazado por AI27',
  RECHAZADO_POR_CLIENTE: 'Rechazado',
  ASIGNADO: 'Asignado',
  APTO_PARA_SALIDA: 'Apto para salida',
  EN_EMBARQUE: 'En embarque',
  PATRULLA_EN_CAMINO: 'Patrulla en camino',
  EN_TRANSITO: 'En tránsito',
  EN_DESTINO: 'En destino',
  EN_DESCARGA: 'En descarga',
  CERRADO: 'Cerrado',
  CANCELADO: 'Cancelado',
};

/**
 * Estado -> señal táctica del `Badge`:
 *   en marcha (tránsito/embarque/destino/descarga/patrulla) -> secure
 *   solicitado/aprobado/asignado/apto                        -> escort (informativo)
 *   cerrado                                                  -> escort
 *   cancelado/rechazado                                      -> alert (rojo)
 *   otro                                                     -> neutral
 */
function variantForEstado(estado: EstadoViaje): BadgeVariant {
  switch (estado) {
    case 'EN_TRANSITO':
    case 'EN_EMBARQUE':
    case 'EN_DESTINO':
    case 'EN_DESCARGA':
    case 'PATRULLA_EN_CAMINO':
      return 'secure';
    case 'SOLICITADO':
    case 'APROBADO':
    case 'ASIGNADO':
    case 'APTO_PARA_SALIDA':
    case 'CERRADO':
      return 'escort';
    case 'CANCELADO':
    case 'RECHAZADO_POR_AI27':
    case 'RECHAZADO_POR_CLIENTE':
      return 'alert';
    default:
      return 'neutral';
  }
}

export function EstadoViajeChip({ estado }: EstadoViajeChipProps) {
  return (
    <Badge variant={variantForEstado(estado)} dot pill>
      {labelByEstado[estado] ?? estado}
    </Badge>
  );
}
