/*
 * El espacio del mapa del panel.
 *
 * el icono es decorativo y
 * el texto explica que la vista no esta disponible todavia. Un icono solo, sin texto,
 * seria un cuadro vacio para quien usa un lector de pantalla.
 */

import { MapPinned } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function MapPlaceholderCard() {
  return (
    <Card
      className="bg-surface-container flex h-full min-h-56 flex-col items-center justify-center gap-3 p-6 text-center"
      ariaLabel="Vista de mapa"
    >
      <MapPinned aria-hidden="true" className="text-on-surface-variant size-10" />
      <p className="text-on-surface-variant text-sm font-medium">
        La vista de mapa todavía no está disponible.
      </p>
    </Card>
  );
}
