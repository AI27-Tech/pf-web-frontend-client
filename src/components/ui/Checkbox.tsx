/*
 * Casilla del design system (Archivo temporal en lo que se revisa y se implementa la librería).
 *
 * Es un `<input type="checkbox">` real dentro de un `<label>`: el clic en el texto
 * marca la casilla y los lectores de pantalla la anuncian con su nombre, sin ARIA
 * manual. El acento visual usa `accent-color` con el rol `primary`.
 */

import { useId, type InputHTMLAttributes } from 'react';
import { cx } from '@/lib/utils';

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'id' | 'type'
> {
  readonly label: string;
  readonly className?: string;
}

export function Checkbox({ label, className, ...rest }: CheckboxProps) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={cx(
        'border-outline-variant text-on-surface flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm',
        'has-checked:border-primary has-checked:bg-primary/5',
        className,
      )}
    >
      <input id={id} type="checkbox" className="accent-primary size-4 shrink-0" {...rest} />
      <span>{label}</span>
    </label>
  );
}
