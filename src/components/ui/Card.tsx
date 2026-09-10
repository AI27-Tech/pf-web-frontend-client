/*
 * Card: el contenedor elevado del design system.
 *
 * Existe para que la definicón de una tarjeta —superficie, borde, radio— exista
 * en UN sitio.
 *
 * No trae padding propio: hay tarjetas que lo necesitan uniforme y otras que
 * separan cabecera de contenido con su propio ritmo. El padding lo decide quien la
 * usa, igual que el layout interno.
 */

import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

interface CardProps {
  readonly children: ReactNode;
  readonly className?: string;
  /**
   * Etiqueta accesible cuando la tarjeta es una region navegable. Si se pasa, la
   * tarjeta se anuncia como `section` con nombre; si no, es un `div` sin semantica.
   */
  readonly ariaLabel?: string;
}

export function Card({ children, className, ariaLabel }: CardProps) {
  const classes = cx(
    'bg-surface-container-lowest border-outline-variant rounded-lg border',
    className,
  );

  if (ariaLabel !== undefined) {
    return (
      <section aria-label={ariaLabel} className={classes}>
        {children}
      </section>
    );
  }

  return <div className={classes}>{children}</div>;
}
