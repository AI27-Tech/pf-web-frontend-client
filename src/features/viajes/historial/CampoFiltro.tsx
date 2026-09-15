/*
 * CampoFiltro: la envoltura de un control de la barra de filtros del Historial.
 *
 * Pone una etiqueta en mayusculas encima del control y, opcionalmente, un icono
 * dentro a la izquierda.
 */

import { useId, type ReactNode } from 'react';

interface CampoFiltroProps {
  readonly label: string;
  /** Icono decorativo dentro del control, a la izquierda. */
  readonly icon?: ReactNode;
  /** Render del control. Recibe el `id` que debe recibir el elemento de formulario. */
  readonly children: (id: string) => ReactNode;
}

export function CampoFiltro({ label, icon, children }: CampoFiltroProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-on-surface-variant text-xs font-semibold uppercase">
        {label}
      </label>
      <div className="relative flex items-center">
        {icon !== undefined && (
          <span className="text-on-surface-variant pointer-events-none absolute left-3 flex items-center">
            {icon}
          </span>
        )}
        {children(id)}
      </div>
    </div>
  );
}
