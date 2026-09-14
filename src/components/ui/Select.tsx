/*
 * Select nativo del design system (Archivo temporal en lo que se revisa y se implementa la librería).
 *
 */

import { useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '@/lib/utils';

export interface OpcionSelect {
  readonly value: string;
  readonly label: string;
}

interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'className' | 'id' | 'children'
> {
  readonly label: string;
  readonly opciones: readonly OpcionSelect[];
  /** Texto de la opcion vacia inicial (p. ej. "Seleccione una categoria"). */
  readonly placeholder?: string;
  readonly error?: string;
  readonly className?: string;
}

export function Select({
  label,
  opciones,
  placeholder,
  error,
  className,
  value,
  ...rest
}: SelectProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-on-surface-variant text-sm font-medium">
        {label}
      </label>
      <div className="relative flex items-center">
        <select
          id={id}
          value={value}
          aria-invalid={error !== undefined || undefined}
          aria-describedby={error !== undefined ? errorId : undefined}
          className={cx(
            'bg-surface-container-lowest border-outline-variant text-on-surface w-full appearance-none rounded-lg border px-3 py-2.5 pr-10 text-sm',
            'focus:border-primary focus:ring-primary focus:ring-1 focus:outline-none',
            // Sin valor seleccionado el texto se atenua, como un placeholder.
            (value === undefined || value === '') && 'text-on-surface-variant/60',
            error !== undefined && 'border-error',
            className,
          )}
          {...rest}
        >
          {placeholder !== undefined && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {opciones.map((opcion) => (
            <option key={opcion.value} value={opcion.value} className="text-on-surface">
              {opcion.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="text-on-surface-variant pointer-events-none absolute right-3 size-4"
        />
      </div>
      {error !== undefined && (
        <p id={errorId} role="alert" className="text-error text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
