/*
 * Tarjeta de seccion del asistente: una `Card` con cabecera (icono opcional + titulo)
 * y cuerpo. Centraliza el ritmo visual que se repite en todos los pasos, para que las
 * secciones no diverjan entre pantallas.
 */

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

interface SeccionCardProps {
  readonly titulo: string;
  /** Icono decorativo a la izquierda del titulo; debe traer `aria-hidden`. */
  readonly icono?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

export function SeccionCard({ titulo, icono, children, className }: SeccionCardProps) {
  return (
    <Card className="p-5" ariaLabel={titulo}>
      <div className="mb-4 flex items-center gap-2">
        {icono !== undefined && <span className="text-primary">{icono}</span>}
        <h2 className="text-on-surface text-base font-semibold">{titulo}</h2>
      </div>
      <div className={className}>{children}</div>
    </Card>
  );
}
