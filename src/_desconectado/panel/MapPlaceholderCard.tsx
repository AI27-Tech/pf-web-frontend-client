/*
 * El espacio del mapa del panel.
 *
 * el icono es decorativo y
 * el texto explica que la vista no esta disponible todavia. Un icono solo, sin texto,
 * seria un cuadro vacio para quien usa un lector de pantalla.
 */

import { MapPinned } from 'lucide-react';
import { Card, CardBody } from '@ai27-tech/ui';

export function MapPlaceholderCard() {
  return (
    // `role="region"` + `aria-label`: el Card de la libreria es un <div> y reenvia estas
    // props, pero un <div> con solo `aria-label` no es un landmark. El rol explicito
    // recupera la region con nombre que daba el <section> del Card anterior.
    <Card
      variant="filled"
      padding="lg"
      className="h-full min-h-56"
      role="region"
      aria-label="Vista de mapa"
    >
      {/* `CardBody` aplica el padding y crece para centrar el placeholder. Se restablece
          el `padding-top` que la libreria reduce al asumir un `CardHeader` encima. */}
      <CardBody className="flex h-full flex-col items-center justify-center gap-3 pt-[var(--card-pad)] text-center">
        <MapPinned aria-hidden="true" className="text-on-surface-variant size-10" />
        <p className="text-on-surface-variant text-sm font-medium">
          La vista de mapa todavía no está disponible.
        </p>
      </CardBody>
    </Card>
  );
}
