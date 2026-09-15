/*
 * Tarjeta de seccion del asistente: una `Card` con cabecera (icono opcional + titulo)
 * y cuerpo. Centraliza el ritmo visual que se repite en todos los pasos, para que las
 * secciones no diverjan entre pantallas.
 */

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

interface SeccionCardProps {
  readonly title: string;
  /** Icono decorativo a la izquierda del titulo; debe traer `aria-hidden`. */
  readonly icon?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

export function SeccionCard({ title, icon, children, className }: SeccionCardProps) {
  return (
    <Card className="p-5" ariaLabel={title}>
      <div className="mb-4 flex items-center gap-2">
        {icon !== undefined && <span className="text-primary">{icon}</span>}
        <h2 className="text-on-surface text-base font-semibold">{title}</h2>
      </div>
      <div className={className}>{children}</div>
    </Card>
  );
}
