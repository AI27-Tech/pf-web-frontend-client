/*
 * SeguimientoSection. La `*Section` del dominio `seguimiento`.
 *
 * Presentacional: recibe los viajes en curso por props y no llama a la API — el
 * fetch lo hacia el `loader` de la ruta.
 *
 * La seleccion vive aqui y no en `ViajesActivosCard` porque otras piezas del diseno
 * (la barra de telemetria) tambien necesitan saber cual es el viaje seleccionado.
 *
 * `showDetail` es el otro estado que vive aqui: "Ver Detalles" no navega a otra
 * ruta (esa pantalla no existe todavia).
 *
 * PROTOTIPO V2 (NO productivo): este es el orquestador de la pantalla de telemetría
 * viva que DEC-001 excluye de V1. Se retiró del release path en E9-T10 / F-06. El
 * placeholder de mapa que montaba (la "Vista de mapa") era superficie de posición V2.
 */

import { useState } from 'react';
import { MapPinned } from 'lucide-react';
import { Card, CardBody } from '@ai27-tech/ui';
import type { ViajeEnCurso } from './viaje-activo';
import { DetalleViajePlaceholderCard } from './DetalleViajePlaceholderCard';
import { TelemetriaExtraCard } from './TelemetriaExtraCard';
import { ViajesActivosCard } from './ViajesActivosCard';

/** El espacio del mapa de posición. Superficie V2: destino de MapLibre. */
function MapPlaceholderCard() {
  return (
    <Card
      variant="filled"
      padding="lg"
      className="h-full min-h-56"
      role="region"
      aria-label="Vista de mapa"
    >
      <CardBody className="flex h-full flex-col items-center justify-center gap-3 pt-[var(--card-pad)] text-center">
        <MapPinned aria-hidden="true" className="text-on-surface-variant size-10" />
        <p className="text-on-surface-variant text-sm font-medium">
          La vista de mapa todavía no está disponible.
        </p>
      </CardBody>
    </Card>
  );
}

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
