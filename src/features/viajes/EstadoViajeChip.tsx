/*
 * El chip de estado de un viaje.
 *
 * `lib/contracts/estados.ts` deja escrito que los estados de viaje
 * son datos del contrato. Hoy el unico estado que la documentacion
 * confirma es SOLICITADO.
 *
 * Composicion de dominio sobre el `Badge` de `@ai27-tech/ui`: mapea el estado (y las
 * condiciones superpuestas) a la senal tactica del `Badge`, que aporta la apariencia.
 */

import { Badge, type BadgeVariant } from '@ai27-tech/ui';
import type { CondicionActiva, EstadoViaje } from '@/lib/contracts';

interface EstadoViajeChipProps {
  readonly estado: EstadoViaje;
  /** Condiciones superpuestas al estado. La primera manda sobre la apariencia. */
  readonly condicionesActivas?: readonly CondicionActiva[];
}

/** Etiquetas de los estados que el cliente conoce. Sin entrada por defecto. */
const labelByEstado: Readonly<Record<string, string>> = {
  SOLICITADO: 'Solicitado',
  EN_RUTA: 'En Ruta',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

/**
 * Estado del viaje -> senal tactica del `Badge` de la libreria (mismo criterio que
 * `ViajesEnCursoTable`):
 *   EN_RUTA               -> secure  (unidad en marcha, sin novedad)
 *   SOLICITADO/COMPLETADO -> escort  (informativo)
 *   CANCELADO             -> alert   (rojo)
 *   otro                  -> neutral
 */
function variantForEstado(estado: EstadoViaje): BadgeVariant {
  if (estado === 'EN_RUTA') return 'secure';
  if (estado === 'SOLICITADO' || estado === 'COMPLETADO') return 'escort';
  if (estado === 'CANCELADO') return 'alert';
  return 'neutral';
}

export function EstadoViajeChip({ estado, condicionesActivas = [] }: EstadoViajeChipProps) {
  const condicion = condicionesActivas[0];

  // Una condicion activa manda sobre el estado: se pinta en `warning` y con su
  // descripcion, no con la etiqueta del estado.
  const variant: BadgeVariant = condicion !== undefined ? 'warning' : variantForEstado(estado);
  const text = condicion?.descripcion ?? labelByEstado[estado] ?? estado;

  return (
    <Badge variant={variant} dot pill>
      {text}
    </Badge>
  );
}
