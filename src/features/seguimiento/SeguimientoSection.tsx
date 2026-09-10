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
  const [viajeSeleccionadoId, setViajeSeleccionadoId] = useState<string | undefined>(
    viajes[0]?.viajeId,
  );
  const [mostrandoDetalle, setMostrandoDetalle] = useState(false);

  const viajeSeleccionado = viajes.find((viaje) => viaje.viajeId === viajeSeleccionadoId);

  return (
    <div className="flex flex-col gap-4 lg:gap-6 xl:flex-row">
      <div className="flex xl:w-1/3">
        {mostrandoDetalle ? (
          <DetalleViajePlaceholderCard />
        ) : (
          <ViajesActivosCard
            viajes={viajes}
            viajeSeleccionadoId={viajeSeleccionadoId}
            onSeleccionar={setViajeSeleccionadoId}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 lg:gap-6">
        <div className="flex-1">
          <MapPlaceholderCard />
        </div>
        <TelemetriaExtraCard
          viaje={viajeSeleccionado}
          mostrandoDetalle={mostrandoDetalle}
          onAlternarDetalle={() => setMostrandoDetalle((valor) => !valor)}
        />
      </div>
    </div>
  );
}
