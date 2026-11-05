/*
 * Resumen de Ruta — SIN funcionalidad de calculo todavia.
 *
 * Reutiliza `MapPlaceholderCard` (el mapa no esta montado, decision abierta 9 del
 * README) y muestra el origen/destino que el usuario va escribiendo.
 */

import { MapPlaceholderCard } from '@/_desconectado/panel/MapPlaceholderCard';
import { Card, CardBody } from '@ai27-tech/ui';

interface ResumenRutaCardProps {
  readonly origen: string;
  readonly destino: string;
}

export function ResumenRutaCard({ origen, destino }: ResumenRutaCardProps) {
  return (
    <Card variant="outlined" padding="lg" role="region" aria-label="Resumen de Ruta">
      <CardBody className="flex flex-col gap-4">
        <h2 className="text-on-surface text-base font-semibold">Resumen de Ruta</h2>

        <MapPlaceholderCard />

        <ol className="flex flex-col gap-3">
          <li className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="border-primary mt-1 size-3 shrink-0 rounded-full border-[3px]"
            />
            <div className="flex flex-col">
              <span className="text-on-surface text-sm font-medium">Origen</span>
              <span className="text-on-surface-variant text-sm">
                {origen.trim() !== '' ? origen : 'Por definir'}
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span aria-hidden="true" className="bg-error mt-1 size-3 shrink-0 rounded-full" />
            <div className="flex flex-col">
              <span className="text-on-surface text-sm font-medium">Destino</span>
              <span className="text-on-surface-variant text-sm">
                {destino.trim() !== '' ? destino : 'Por definir'}
              </span>
            </div>
          </li>
        </ol>

        <div className="border-outline-variant flex items-center justify-between border-t pt-3">
          <span className="text-on-surface-variant text-sm">Distancia estimada:</span>
          <span className="text-on-surface-variant text-sm font-medium">-- km</span>
        </div>
      </CardBody>
    </Card>
  );
}
