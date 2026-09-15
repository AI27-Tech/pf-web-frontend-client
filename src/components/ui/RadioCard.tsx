/*
 * Tarjeta seleccionable (radio) del design system (Archivo temporal en lo que se valida y se implementa
 * la nueva librería).
 *
 * Es un `<input type="radio">` real (visualmente oculto) dentro de un `<label>`: da
 * seleccion por teclado, agrupacion por `name` y anuncio con nombre sin ARIA manual.
 * La tarjeta seleccionada se marca con borde `primary` y un indicador circular; ambos
 * derivan del estado del radio con las variantes `has-checked`/`peer-checked`.
 */

import { useId, type ReactNode } from 'react';
import { cx } from '@/lib/utils';

interface RadioCardProps {
  readonly name: string;
  readonly value: string;
  readonly checked: boolean;
  readonly onChange: (value: string) => void;
  readonly title: string;
  readonly description: string;
  /** Icono decorativo; debe traer `aria-hidden`. */
  readonly icon: ReactNode;
}

export function RadioCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  icon,
}: RadioCardProps) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={cx(
        'bg-surface-container-lowest border-outline-variant relative flex cursor-pointer flex-col gap-2 rounded-lg border p-4',
        'has-checked:border-primary has-checked:ring-primary has-checked:ring-1',
      )}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      {/* Indicador circular */}
      <span
        aria-hidden="true"
        className={cx(
          'border-outline absolute top-4 right-4 size-4 rounded-full border',
          'peer-checked:border-primary peer-checked:border-[5px]',
        )}
      />
      <span className="text-primary">{icon}</span>
      <span className="text-on-surface pr-6 text-sm font-semibold">{title}</span>
      <span className="text-on-surface-variant text-xs">{description}</span>
    </label>
  );
}
