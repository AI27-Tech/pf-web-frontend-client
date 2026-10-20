/*
 * Tarjeta de seccion del asistente: una `Card` con cabecera (icono opcional + titulo)
 * y cuerpo. Centraliza el ritmo visual que se repite en todos los pasos, para que las
 * secciones no diverjan entre pantallas.
 *
 * Es una COMPOSICION de dominio sobre el `Card` de `@ai27-tech/ui`, no un wrapper que
 * reimplemente la tarjeta: aporta el patron cabecera+cuerpo propio del asistente.
 */

import type { ReactNode } from 'react';
import { Card, CardBody } from '@ai27-tech/ui';

interface SeccionCardProps {
  readonly title: string;
  /** Icono decorativo a la izquierda del titulo; debe traer `aria-hidden`. */
  readonly icon?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

export function SeccionCard({ title, icon, children, className }: SeccionCardProps) {
  return (
    <Card variant="outlined" padding="lg" role="region" aria-label={title}>
      <CardBody>
        <div className="mb-4 flex items-center gap-2">
          {icon !== undefined && <span className="text-primary">{icon}</span>}
          <h2 className="text-on-surface text-base font-semibold">{title}</h2>
        </div>
        <div className={className}>{children}</div>
      </CardBody>
    </Card>
  );
}
