/*
 * El espacio de detalle de un viaje en Seguimiento en Vivo.
 */

import { Info } from 'lucide-react';
import { Card, CardBody } from '@ai27-tech/ui';

export function DetalleViajePlaceholderCard() {
  return (
    <Card
      variant="outlined"
      padding="md"
      role="region"
      className="h-full w-full"
      aria-label="Detalle del viaje"
    >
      <CardBody className="bg-surface-container flex h-full w-full flex-col items-center justify-center gap-3 text-center">
        <Info aria-hidden="true" className="text-on-surface-variant size-10" />
        <p className="text-on-surface-variant text-sm font-medium">Más información</p>
      </CardBody>
    </Card>
  );
}
