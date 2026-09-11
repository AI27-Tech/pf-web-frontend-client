import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '@/lib/utils';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'id'> {
  readonly label: string;
  /** Mensaje de error. Se asocia por aria-describedby, no solo por color. */
  readonly error?: string;
  readonly className?: string;
  /** Contenido antes del campo, p. ej. un icono de correo o de candado. */
  readonly leadingSlot?: ReactNode;
  /** Contenido despues del campo, p. ej. el boton de mostrar/ocultar contrasena. */
  readonly trailingSlot?: ReactNode;
}

export function Input({ label, error, className, leadingSlot, trailingSlot, ...rest }: InputProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-on-surface-variant text-sm font-medium">
        {label}
      </label>
      <div className="relative flex items-center">
        {leadingSlot !== undefined && (
          <span className="text-on-surface-variant pointer-events-none absolute left-3 flex items-center">
            {leadingSlot}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error !== undefined || undefined}
          aria-describedby={error !== undefined ? errorId : undefined}
          className={cx(
            'bg-surface-container-lowest border-outline-variant text-on-surface w-full rounded-lg border px-3 py-2.5 text-sm',
            'placeholder:text-on-surface-variant/60',
            'focus:border-primary focus:ring-primary focus:ring-1 focus:outline-none',
            leadingSlot !== undefined && 'pl-10',
            trailingSlot !== undefined && 'pr-10',
            error !== undefined && 'border-error',
            className,
          )}
          {...rest}
        />
        {trailingSlot !== undefined && (
          <span className="absolute right-3 flex items-center">{trailingSlot}</span>
        )}
      </div>
      {error !== undefined && (
        <p id={errorId} role="alert" className="text-error text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
