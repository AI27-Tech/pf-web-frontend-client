/*
 * Paso 2 — Ruta.
 *
 * Dos bloques de ubicacion (Origen y Destino) con el mismo formulario, cada uno
 * despachando a su seccion del borrador, y el panel lateral "Resumen de Ruta" (sin
 * calculo). El resumen refleja el nombre del lugar que se va escribiendo; si aun no
 * hay nombre, cae en la ciudad como pista, y si tampoco, en "Por definir".
 */

import type { Dispatch } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import type { DatosUbicacion } from '@/lib/contracts';
import type { AccionBorrador } from './borrador';
import { SeccionCard } from './SeccionCard';
import { UbicacionFields } from './UbicacionFields';
import { ResumenRutaCard } from './ResumenRutaCard';

interface PasoRutaProps {
  readonly origen: DatosUbicacion;
  readonly destino: DatosUbicacion;
  readonly dispatch: Dispatch<AccionBorrador>;
}

/** Texto resumido de una ubicacion: nombre si lo hay, si no la ciudad, si no vacio. */
function resumen(ubicacion: DatosUbicacion): string {
  if (ubicacion.nombreLugar.trim() !== '') return ubicacion.nombreLugar;
  if (ubicacion.ciudadEstado.trim() !== '') return ubicacion.ciudadEstado;
  return '';
}

export function PasoRuta({ origen, destino, dispatch }: PasoRutaProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <SeccionCard titulo="Origen" icono={<Navigation aria-hidden="true" className="size-5" />}>
          <UbicacionFields
            datos={origen}
            onCampo={(campo, valor) => dispatch({ tipo: 'origen', campo, valor })}
            ejemplos={{
              nombreLugar: 'Ej. Centro de Distribución Norte',
              calleNumero: 'Ej. Av. Principal 123',
              ciudadEstado: 'Ej. Monterrey, N.L.',
              codigoPostal: 'Ej. 64000',
              instruccionesAcceso: 'Indicaciones especiales para la recolección…',
            }}
          />
        </SeccionCard>

        <SeccionCard titulo="Destino" icono={<MapPin aria-hidden="true" className="size-5" />}>
          <UbicacionFields
            datos={destino}
            onCampo={(campo, valor) => dispatch({ tipo: 'destino', campo, valor })}
            ejemplos={{
              nombreLugar: 'Ej. Planta de Manufactura Sur',
              calleNumero: 'Ej. Blvd. Industrial 456',
              ciudadEstado: 'Ej. Guadalajara, Jal.',
              codigoPostal: 'Ej. 44000',
              instruccionesAcceso: 'Indicaciones especiales para la entrega…',
            }}
          />
        </SeccionCard>
      </div>

      <div className="lg:col-span-1">
        <ResumenRutaCard origen={resumen(origen)} destino={resumen(destino)} />
      </div>
    </div>
  );
}
