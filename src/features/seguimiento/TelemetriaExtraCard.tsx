/*
 * La barra de telemetria de Seguimiento en Vivo.
 *
 * Muestra velocidad promedio, temperatura de carga y bateria del GPS del viaje
 * SELECCIONADO en "Viajes Activos" — no un agregado de la flota. Por eso recibe un
 * `ViajeEnCurso | undefined` y no una lista: si no hay ningun viaje que mostrar (lista
 * vacia), no hay telemetria que pintar, y la tarjeta lo dice en vez de mostrar ceros.
 *
 * Es una barra ancha a proposito, mas ancha que la lista de tarjetas: el diseno le da
 * todo el ancho disponible porque son tres lecturas puntuales, no una lista.
 *
 */

import { Battery, Gauge, Thermometer } from 'lucide-react';
import type { ViajeEnCurso } from '@/lib/contracts';
import { Card } from '@/components/ui/Card';

function InformationElement({
  icon: Icon,
  label,
  value,
}: {
  readonly icon: typeof Gauge;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon aria-hidden="true" className="text-on-surface-variant size-5 shrink-0" />
      <div className="flex flex-col">
        <span className="text-on-surface-variant text-xs">{label}</span>
        <span className="text-on-surface text-sm font-semibold">{value}</span>
      </div>
    </div>
  );
}

interface TelemetriaExtraCardProps {
  readonly viaje: ViajeEnCurso | undefined;
  /** Si el panel de detalle esta abierto: decide la etiqueta del boton. */
  readonly showDetail: boolean;
  readonly onToggleDetail: () => void;
}

export function TelemetriaExtraCard({
  viaje,
  showDetail,
  onToggleDetail,
}: TelemetriaExtraCardProps) {
  if (viaje === undefined) {
    return (
      <Card className="p-4 sm:p-6" ariaLabel="Telemetria del viaje seleccionado">
        <p className="text-on-surface-variant text-sm">
          Selecciona un viaje activo para ver su telemetria.
        </p>
      </Card>
    );
  }

  return (
    <Card
      className="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-6"
      ariaLabel="Telemetria del viaje seleccionado"
    >
      <div className="flex flex-wrap items-center gap-6">
        <InformationElement
          icon={Gauge}
          label="Velocidad Promedio"
          value={`${viaje.velocidadPromedioKmh} km/h`}
        />
        <InformationElement
          icon={Thermometer}
          label="Temp. Carga"
          value={`${viaje.temperaturaCargaC}°C`}
        />
        <InformationElement icon={Battery} label="Batería GPS" value={`${viaje.bateriaGpsPct}%`} />
      </div>

      <button
        type="button"
        onClick={onToggleDetail}
        aria-pressed={showDetail}
        className="bg-primary text-on-primary hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors"
      >
        {showDetail ? 'Volver a Viajes Activos' : 'Ver Detalles'}
      </button>
    </Card>
  );
}
