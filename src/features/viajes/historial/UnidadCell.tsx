/*
 * UnidadCell: la celda "VEHICULO / CONDUCTOR" del Historial de Viajes.
 *
 * Muestra el vehiculo ("Volvo FH16 (AB-123)") con el conductor debajo, junto a un
 * icono de camion. Cuando el viaje aun no tiene unidad (`unidad === null`, p. ej. un
 * viaje recien SOLICITADO), dice "Sin asignar".
 */

import { Truck } from 'lucide-react';
import type { UnidadAsignada } from '@/lib/contracts';

interface UnidadCellProps {
  readonly unidad: UnidadAsignada | null;
}

export function UnidadCell({ unidad }: UnidadCellProps) {
  if (unidad === null) {
    return <span className="text-on-surface-variant text-sm italic">Sin asignar</span>;
  }

  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="bg-surface-container-high text-on-surface-variant flex size-8 shrink-0 items-center justify-center rounded-md"
      >
        <Truck className="size-4" />
      </span>
      <div className="flex flex-col">
        <span className="text-on-surface font-semibold">
          {unidad.descripcion} ({unidad.placa})
        </span>
        <span className="text-on-surface-variant text-xs">{unidad.conductorNombre}</span>
      </div>
    </div>
  );
}
