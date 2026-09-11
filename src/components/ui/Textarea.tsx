/*
 * Textarea del design system (Archivo temporal en lo que se revisa y se implementa la librería)
 */

import { useId, type TextareaHTMLAttributes } from 'react';
import { cx } from '@/lib/utils';

interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'className' | 'id'
> {
  readonly label: string;
  readonly error?: string;
  readonly className?: string;
}

export function Textarea({ label, error, className, rows = 3, ...rest }: TextareaProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-on-surface-variant text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error !== undefined || undefined}
        aria-describedby={error !== undefined ? errorId : undefined}
        className={cx(
          'bg-surface-container-lowest border-outline-variant text-on-surface w-full resize-y rounded-lg border px-3 py-2.5 text-sm',
          'placeholder:text-on-surface-variant/60',
          'focus:border-primary focus:ring-primary focus:ring-1 focus:outline-none',
          error !== undefined && 'border-error',
          className,
        )}
        {...rest}
      />
      {error !== undefined && (
        <p id={errorId} role="alert" className="text-error text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
