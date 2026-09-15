/*
 * "Viajes Activos": la lista de tarjetas de Seguimiento en Vivo.
 *
 * Presentacional: recibe los viajes, cual esta seleccionado y el callback de
 * seleccion por props. El contador "N En Ruta" se calcula aqui mismo contando
 * `estado === 'EN_RUTA'` en lugar de venir del wire.
 */

import type { ViajeEnCurso } from '@/lib/contracts';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { ViajeActivoCard } from './ViajeActivoCard';

interface ViajesActivosCardProps {
  readonly viajes: readonly ViajeEnCurso[];
  readonly selectedViajeId: string | undefined;
  readonly onSelect: (viajeId: string) => void;
}

export function ViajesActivosCard({ viajes, selectedViajeId, onSelect }: ViajesActivosCardProps) {
  const enRutaCount = viajes.filter((viaje) => viaje.estado === 'EN_RUTA').length;

  return (
    <Card className="flex h-full w-full flex-col gap-3 p-4" ariaLabel="Viajes activos">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-on-surface text-lg font-bold">Viajes Activos</h2>
        <span className="bg-surface-container-high text-on-surface-variant rounded-full px-2.5 py-1 text-xs font-semibold">
          {enRutaCount} En Ruta
        </span>
      </div>

      {viajes.length === 0 ? (
        <EmptyState title="No hay viajes activos">
          Cuando un servicio se ponga en marcha aparecera aqui.
        </EmptyState>
      ) : (
        <ul className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          {viajes.map((viaje, index) => (
            <ViajeActivoCard
              key={viaje.viajeId}
              viaje={viaje}
              index={index}
              selected={viaje.viajeId === selectedViajeId}
              onSelect={() => onSelect(viaje.viajeId)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
