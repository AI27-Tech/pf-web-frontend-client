/*
 * Paso 1 — Servicio y Fecha.
 *
 * Presentacional: recibe los datos de servicio del borrador, los catalogos y el
 * `dispatch`, y no llama a la API. Las descripciones e iconos de las tarjetas de tipo
 * de servicio son PRESENTACION y viven aqui (el catalogo solo trae `{ id, nombre }`);
 * si el catalogo trae un tipo que no reconocemos, la tarjeta se pinta igual con un
 * icono y una descripcion neutros en vez de romperse.
 */

import type { Dispatch, ReactNode } from 'react';
import { CalendarClock, MapPin, Radar, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import type { DatosServicio, OpcionCatalogo } from '@/lib/contracts';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RadioCard } from '@/components/ui/RadioCard';
import type { AccionBorrador } from './borrador';
import { SeccionCard } from './SeccionCard';

interface PasoServicioFechaProps {
  readonly datos: DatosServicio;
  readonly tiposServicio: readonly OpcionCatalogo[];
  readonly prioridades: readonly OpcionCatalogo[];
  readonly dispatch: Dispatch<AccionBorrador>;
}

/** Descripcion e icono por tipo de servicio conocido.*/
const PRESENTATION_TYPE: Readonly<
  Record<string, { readonly description: string; readonly icon: ReactNode }>
> = {
  'monitoreo-activo': {
    description: 'Seguimiento en tiempo real con inteligencia artificial preventiva.',
    icon: <Radar aria-hidden="true" className="size-6" />,
  },
  'custodia-armada': {
    description: 'Escolta física altamente capacitada para rutas de alto riesgo.',
    icon: <ShieldCheck aria-hidden="true" className="size-6" />,
  },
  'localizacion-gps': {
    description: 'Dispositivos de rastreo autónomos de alta precisión.',
    icon: <MapPin aria-hidden="true" className="size-6" />,
  },
};

const PRESENTATION_NEUTRAL = {
  description: 'Servicio de protección logística.',
  icon: <ShieldCheck aria-hidden="true" className="size-6" />,
} as const;

export function PasoServicioFecha({
  datos,
  tiposServicio,
  prioridades,
  dispatch,
}: PasoServicioFechaProps) {
  const setField = (field: keyof DatosServicio, value: string): void => {
    dispatch({ tipo: 'servicio', campo: field, valor: value });
  };

  return (
    <div className="flex flex-col gap-6">
      <SeccionCard title="1. Tipo de Servicio">
        <fieldset>
          <legend className="sr-only">Tipo de servicio</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            {tiposServicio.map((tipo) => {
              const presentation = PRESENTATION_TYPE[tipo.id] ?? PRESENTATION_NEUTRAL;
              return (
                <RadioCard
                  key={tipo.id}
                  name="tipo-servicio"
                  value={tipo.id}
                  checked={datos.tipoServicio === tipo.id}
                  onChange={(value) => setField('tipoServicio', value)}
                  title={tipo.nombre}
                  description={presentation.description}
                  icon={presentation.icon}
                />
              );
            })}
          </div>
        </fieldset>
      </SeccionCard>

      <SeccionCard
        title="2. Programación de Salida"
        icon={<CalendarClock aria-hidden="true" className="size-5" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Fecha de salida *"
            type="date"
            value={datos.fechaSalida}
            onChange={(event) => setField('fechaSalida', event.target.value)}
          />
          <Input
            label="Hora de salida estimada *"
            type="time"
            value={datos.horaSalida}
            onChange={(event) => setField('horaSalida', event.target.value)}
          />
        </div>
      </SeccionCard>

      <SeccionCard
        title="3. Detalles Operativos"
        icon={<SlidersHorizontal aria-hidden="true" className="size-5" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Prioridad del servicio"
            options={prioridades.map((option) => ({ value: option.id, label: option.nombre }))}
            placeholder="Seleccione una prioridad"
            value={datos.prioridad}
            onChange={(event) => setField('prioridad', event.target.value)}
          />
          <Input
            label="Referencia / No. Orden de Compra (Opcional)"
            value={datos.referenciaOrden}
            onChange={(event) => setField('referenciaOrden', event.target.value)}
            placeholder="Ej. PO-98273"
          />
          <Input
            label="Nombre del contacto en sitio *"
            value={datos.contactoNombre}
            onChange={(event) => setField('contactoNombre', event.target.value)}
            placeholder="Nombre completo"
          />
          <Input
            label="Teléfono del contacto *"
            value={datos.contactoTelefono}
            onChange={(event) => setField('contactoTelefono', event.target.value)}
            placeholder="+52 55 0000 0000"
          />
        </div>
      </SeccionCard>
    </div>
  );
}
