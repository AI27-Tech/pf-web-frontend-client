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
  const currentIndex = PASOS_VISIBLES.indexOf(pasoActual);

  return (
    <ol className="flex items-center gap-2">
      {PASOS_VISIBLES.map((paso, index) => {
        const completed = index < currentIndex;
        const active = index === currentIndex;

        return (
          <li key={paso} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cx(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  completed || active
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant',
                )}
              >
                {completed ? <Check className="size-4" /> : index + 1}
              </span>
              <span
                aria-current={active ? 'step' : undefined}
                className={cx(
                  'text-center text-xs font-medium whitespace-nowrap',
                  active ? 'text-primary' : 'text-on-surface-variant',
                )}
              >
                {ETIQUETA_PASO[paso]}
              </span>
            </div>
            {/* Conector hacia el siguiente paso; el ultimo no lo lleva. */}
            {index < PASOS_VISIBLES.length - 1 && (
              <span
                aria-hidden="true"
                className={cx(
                  'mb-5 h-0.5 flex-1 rounded-full',
                  completed ? 'bg-primary' : 'bg-outline-variant',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
