/*
 * ProgresoViaje — recorrido del viaje en cuatro pasos (Solicitado → Entregado).
 *
 * Presentacional. Recibe el estado del contrato y deja a `pasosViaje.ts` decidir en qué
 * paso va. Si el viaje no está en el recorrido (cancelado o rechazado) no pinta nada.
 *
 * No usa una lista (`ul`/`ol`): el detalle ya tiene una lista propia, la de incidencias, y
 * las pruebas la identifican por rol. El paso se anuncia con `aria-current="step"` y un
 * texto solo para lectores de pantalla, porque el color no debe ser lo único que lo diga.
 */

import { Check } from 'lucide-react';
import { Card, CardBody } from '@ai27-tech/ui';
import { PASOS_VIAJE, pasoDelViaje, situacionDePasos, type SituacionPaso } from './pasosViaje';

const CLASE_CIRCULO: Record<SituacionPaso, string> = {
  hecho: 'bg-primary text-on-primary',
  actual: 'bg-primary text-on-primary ring-primary/30 ring-4',
  pendiente: 'bg-surface-container-high border-outline-variant border',
};

const TEXTO_SITUACION: Record<SituacionPaso, string> = {
  hecho: 'completado',
  actual: 'paso actual',
  pendiente: 'pendiente',
};

export function ProgresoViaje({ estado }: { readonly estado: string }) {
  const paso = pasoDelViaje(estado);
  if (paso === null) return null;
  const situaciones = situacionDePasos(paso);

  return (
    <Card variant="outlined" padding="lg">
      <CardBody>
        <div role="group" aria-label="Progreso del viaje" className="flex items-start">
          {PASOS_VIAJE.map((nombre, indice) => {
            const situacion = situaciones[indice] ?? 'pendiente';
            return (
              <div
                key={nombre}
                aria-current={situacion === 'actual' ? 'step' : undefined}
                className="relative flex flex-1 flex-col items-center gap-2 text-center"
              >
                {/*
                  Conector con el paso anterior: va de un círculo al otro, con un respiro en
                  cada extremo, y toma el color de marca si ese tramo ya se recorrió.
                */}
                {indice > 0 && (
                  <div
                    aria-hidden="true"
                    className={
                      'absolute top-[11px] right-[calc(50%+1.25rem)] left-[calc(-50%+1.25rem)] h-0.5 ' +
                      (situacion === 'pendiente' ? 'bg-outline-variant' : 'bg-primary')
                    }
                  />
                )}
                <span
                  aria-hidden="true"
                  className={
                    'flex size-6 items-center justify-center rounded-full ' +
                    CLASE_CIRCULO[situacion]
                  }
                >
                  {situacion === 'hecho' && <Check className="size-3.5" />}
                </span>
                <span
                  className={
                    'text-xs ' +
                    (situacion === 'pendiente'
                      ? 'text-on-surface-variant'
                      : situacion === 'actual'
                        ? 'text-on-surface font-semibold'
                        : 'text-on-surface')
                  }
                >
                  {nombre}
                  <span className="sr-only"> ({TEXTO_SITUACION[situacion]})</span>
                </span>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
