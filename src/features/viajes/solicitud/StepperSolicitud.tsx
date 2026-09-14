/*
 * Indicador de progreso del asistente (los cuatro pasos numerados).
 *
 * Estado por paso: completado (check), activo (circulo `primary` con su numero) y
 * pendiente (circulo neutro).
 */

import { Check } from 'lucide-react';
import { cx } from '@/lib/utils';
import { ETIQUETA_PASO, PASOS_VISIBLES, type PasoVisible } from './pasos';

export function StepperSolicitud({ pasoActual }: { readonly pasoActual: PasoVisible }) {
  const indiceActual = PASOS_VISIBLES.indexOf(pasoActual);

  return (
    <ol className="flex items-center gap-2">
      {PASOS_VISIBLES.map((paso, indice) => {
        const completado = indice < indiceActual;
        const activo = indice === indiceActual;

        return (
          <li key={paso} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cx(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  completado || activo
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant',
                )}
              >
                {completado ? <Check className="size-4" /> : indice + 1}
              </span>
              <span
                aria-current={activo ? 'step' : undefined}
                className={cx(
                  'text-center text-xs font-medium whitespace-nowrap',
                  activo ? 'text-primary' : 'text-on-surface-variant',
                )}
              >
                {ETIQUETA_PASO[paso]}
              </span>
            </div>
            {/* Conector hacia el siguiente paso; el ultimo no lo lleva. */}
            {indice < PASOS_VISIBLES.length - 1 && (
              <span
                aria-hidden="true"
                className={cx(
                  'mb-5 h-0.5 flex-1 rounded-full',
                  completado ? 'bg-primary' : 'bg-outline-variant',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
