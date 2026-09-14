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
const PRESENTACION_TIPO: Readonly<
  Record<string, { readonly descripcion: string; readonly icono: ReactNode }>
> = {
  'monitoreo-activo': {
    descripcion: 'Seguimiento en tiempo real con inteligencia artificial preventiva.',
    icono: <Radar aria-hidden="true" className="size-6" />,
  },
  'custodia-armada': {
    descripcion: 'Escolta física altamente capacitada para rutas de alto riesgo.',
    icono: <ShieldCheck aria-hidden="true" className="size-6" />,
  },
  'localizacion-gps': {
    descripcion: 'Dispositivos de rastreo autónomos de alta precisión.',
    icono: <MapPin aria-hidden="true" className="size-6" />,
  },
};

const PRESENTACION_NEUTRA = {
  descripcion: 'Servicio de protección logística.',
  icono: <ShieldCheck aria-hidden="true" className="size-6" />,
} as const;

export function PasoServicioFecha({
  datos,
  tiposServicio,
  prioridades,
  dispatch,
}: PasoServicioFechaProps) {
  const setCampo = (campo: keyof DatosServicio, valor: string): void => {
    dispatch({ tipo: 'servicio', campo, valor });
  };

  return (
    <div className="flex flex-col gap-6">
      <SeccionCard titulo="1. Tipo de Servicio">
        <fieldset>
          <legend className="sr-only">Tipo de servicio</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            {tiposServicio.map((tipo) => {
              const presentacion = PRESENTACION_TIPO[tipo.id] ?? PRESENTACION_NEUTRA;
              return (
                <RadioCard
                  key={tipo.id}
                  name="tipo-servicio"
                  value={tipo.id}
                  checked={datos.tipoServicio === tipo.id}
                  onChange={(valor) => setCampo('tipoServicio', valor)}
                  titulo={tipo.nombre}
                  descripcion={presentacion.descripcion}
                  icono={presentacion.icono}
                />
              );
            })}
          </div>
        </fieldset>
      </SeccionCard>

      <SeccionCard
        titulo="2. Programación de Salida"
        icono={<CalendarClock aria-hidden="true" className="size-5" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Fecha de salida *"
            type="date"
            value={datos.fechaSalida}
            onChange={(evento) => setCampo('fechaSalida', evento.target.value)}
          />
          <Input
            label="Hora de salida estimada *"
            type="time"
            value={datos.horaSalida}
            onChange={(evento) => setCampo('horaSalida', evento.target.value)}
          />
        </div>
      </SeccionCard>

      <SeccionCard
        titulo="3. Detalles Operativos"
        icono={<SlidersHorizontal aria-hidden="true" className="size-5" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Prioridad del servicio"
            opciones={prioridades.map((opcion) => ({ value: opcion.id, label: opcion.nombre }))}
            placeholder="Seleccione una prioridad"
            value={datos.prioridad}
            onChange={(evento) => setCampo('prioridad', evento.target.value)}
          />
          <Input
            label="Referencia / No. Orden de Compra (Opcional)"
            value={datos.referenciaOrden}
            onChange={(evento) => setCampo('referenciaOrden', evento.target.value)}
            placeholder="Ej. PO-98273"
          />
          <Input
            label="Nombre del contacto en sitio *"
            value={datos.contactoNombre}
            onChange={(evento) => setCampo('contactoNombre', evento.target.value)}
            placeholder="Nombre completo"
          />
          <Input
            label="Teléfono del contacto *"
            value={datos.contactoTelefono}
            onChange={(evento) => setCampo('contactoTelefono', evento.target.value)}
            placeholder="+52 55 0000 0000"
          />
        </div>
      </SeccionCard>
    </div>
  );
}
