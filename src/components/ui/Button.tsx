import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  readonly variant?: Variant;
  readonly children: ReactNode;
  /** Deshabilita y anuncia el trabajo en curso a lectores de pantalla. */
  readonly pending?: boolean;
  readonly className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90',
  secondary:
    'bg-surface-container-lowest text-primary border-primary hover:bg-surface-container border',
  ghost: 'text-on-surface-variant hover:bg-surface-container bg-transparent',
  danger: 'bg-error text-on-error hover:bg-error/90',
};

export function Button({
  variant = 'primary',
  children,
  pending = false,
  className,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled === true || pending}
      aria-busy={pending || undefined}
      className={cx(
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
