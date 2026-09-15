/*
 * SeguimientoSection. La `*Section` del dominio `seguimiento`.
 *
 * Presentacional: recibe los viajes en curso por props y no llama a la API — el
 * fetch lo hace el `loader` de la ruta.
 *
 * La seleccion vive aqui y no en `ViajesActivosCard` porque otras piezas del diseno
 * (la barra de telemetria) tambien necesitan saber cual es el viaje seleccionado.
 *
 * `mostrandoDetalle` es el otro estado que vive aqui: "Ver Detalles" no navega a otra
 * ruta (esa pantalla no existe todavia).
 */

import { useState } from 'react';
import type { ViajeEnCurso } from '@/lib/contracts';
import { MapPlaceholderCard } from '@/features/panel/MapPlaceholderCard';
import { DetalleViajePlaceholderCard } from './DetalleViajePlaceholderCard';
import { TelemetriaExtraCard } from './TelemetriaExtraCard';
import { ViajesActivosCard } from './ViajesActivosCard';

export function SeguimientoSection({ viajes }: { readonly viajes: readonly ViajeEnCurso[] }) {
  // La primera tarjeta va seleccionada por defecto, igual que muestra el diseno.
  const [selectedViajeId, setSelectedViajeId] = useState<string | undefined>(viajes[0]?.viajeId);
  const [showDetail, setShowDetail] = useState(false);

  const selectedViaje = viajes.find((viaje) => viaje.viajeId === selectedViajeId);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:gap-6 xl:flex-row">
      <div className="flex min-h-0 xl:h-full xl:w-1/3">
        {showDetail ? (
          <DetalleViajePlaceholderCard />
        ) : (
          <ViajesActivosCard
            viajes={viajes}
            selectedViajeId={selectedViajeId}
            onSelect={setSelectedViajeId}
          />
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:gap-6">
        <div className="min-h-56 flex-1">
          <MapPlaceholderCard />
        </div>
        <TelemetriaExtraCard
          viaje={selectedViaje}
          showDetail={showDetail}
          onToggleDetail={() => setShowDetail((prev) => !prev)}
        />
      </div>
    </div>
  );
}
