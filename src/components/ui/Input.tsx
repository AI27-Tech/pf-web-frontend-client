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
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative flex items-center">
        {leadingSlot !== undefined && (
          <span className="pointer-events-none absolute left-3 flex items-center text-slate-400">
            {leadingSlot}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error !== undefined || undefined}
          aria-describedby={error !== undefined ? errorId : undefined}
          className={cx(
            'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900',
            'placeholder:text-slate-400',
            'focus:border-brand-500 focus:ring-brand-500 focus:ring-1 focus:outline-none',
            leadingSlot !== undefined && 'pl-10',
            trailingSlot !== undefined && 'pr-10',
            error !== undefined && 'border-red-500',
            className,
          )}
          {...rest}
        />
        {trailingSlot !== undefined && (
          <span className="absolute right-3 flex items-center">{trailingSlot}</span>
        )}
      </div>
      {error !== undefined && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
