/*
 * El componente que hace visible la regla "ausente por degradacion no es ausente".
 *
 * Es el punto de la UI donde §C.3 se cumple o se rompe. Recibe un `Fresco<T>` y
 * garantiza tres cosas:
 *
 *   1. `presente`                 -> se pinta el dato, con su antiguedad si importa.
 *   2. `ausente-por-degradacion`  -> se pinta una MARCA explicita que dice que no lo
 *                                    sabemos ahora, mas el ultimo dato conocido si
 *                                    lo hay, SIEMPRE etiquetado como viejo.
 *   3. `sin-dato`                 -> se pinta que no hay dato. Distinto de (2).
 *
 * Lo que este componente impide por construccion: colapsar (2) en (3). Un mapa que
 * presenta "posicion no disponible por degradacion" como "sin posicion" es el mapa
 * que miente, y el diseno lo declara peor que un mapa que se calla.
 */

import type { ReactNode } from 'react';
import type { Fresco } from '@/lib/contracts';
import { ageInSeconds, formatDateTime } from '@/lib/utils';

interface FreshnessMarkProps<T> {
  readonly data: Fresco<T>;
  readonly render: (value: T) => ReactNode;
  /** Nombre del dato, para los mensajes: "posicion", "ETA"… */
  readonly label: string;
  /** Segundos por encima de los cuales un dato presente se marca como viejo. */
  readonly staleThresholdSeconds?: number;
}

export function FreshnessMark<T>({
  data,
  render,
  label,
  staleThresholdSeconds = 60,
}: FreshnessMarkProps<T>) {
  if (data.estado === 'presente') {
    const ageSeconds = ageInSeconds(data.observadoEn);
    const isStale = ageSeconds > staleThresholdSeconds;

    return (
      <div className="flex flex-col gap-0.5">
        <div>{render(data.valor)}</div>
        {isStale && (
          <p className="text-degradado-800 text-xs">
            Observado hace {ageSeconds}s — puede no reflejar la situacion actual.
          </p>
        )}
      </div>
    );
  }

  if (data.estado === 'ausente-por-degradacion') {
    return (
      <div
        role="status"
        className="bg-degradado-50 text-degradado-800 flex flex-col gap-0.5 rounded-md px-2 py-1.5 text-sm"
      >
        <p className="font-medium">Sin {label} en este momento</p>
        <p className="text-xs">{data.motivo}</p>
        {data.ultimoDatoEn !== null && (
          <p className="text-xs">
            Ultimo dato conocido: {formatDateTime(data.ultimoDatoEn)} (no actualizado)
          </p>
        )}
      </div>
    );
  }

  return <p className="text-on-surface-variant text-sm">Sin {label} registrada.</p>;
}
