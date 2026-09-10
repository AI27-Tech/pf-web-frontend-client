/*
 * El espacio de detalle de un viaje en Seguimiento en Vivo.
 */

import { Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function DetalleViajePlaceholderCard() {
  return (
    <Card
      className="bg-surface-container flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center"
      ariaLabel="Detalle del viaje"
    >
      <Info aria-hidden="true" className="text-on-surface-variant size-10" />
      <p className="text-on-surface-variant text-sm font-medium">Más información</p>
    </Card>
  );
}
