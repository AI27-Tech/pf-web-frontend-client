/*
 * La celda de ETA de la tabla de viajes en curso.
 *
 * Es el sitio donde la regla "ausente por degradacion no es ausente" se aplica en una
 * sola linea de tabla, y por eso no reutiliza `FreshnessMark`: esa marca esta pensada
 * para una ficha, ocupa tres lineas y dentro de una fila rompe el ritmo vertical de
 * toda la tabla. Lo que NO cambia es la distincion, que sigue siendo de tres estados:
 *
 *   presente                  -> la hora, truncada si se sale de la plantilla
 *   ausente-por-degradacion   -> "ETA no disponible", con motivo y ultimo dato en el title
 *   sin-dato                  -> "Pendiente"
 *
 * "Pendiente" y "ETA no disponible" dicen cosas distintas a proposito: el primero es un
 * viaje que todavia no tiene ETA calculado; el segundo, un ETA que existe y que ahora
 * mismo no podemos consultar. Colapsarlos en un guion seria la version tabular del
 * mapa que miente.
 */

import type { Eta, Fresco } from '@/lib/contracts';
import { ETA_MAX_CHARS } from '@/lib/constants';
import { formatEtaTexto } from '@/lib/tracking/formatEta';
import { formatDateTime, truncate } from '@/lib/utils';

interface EtaCellProps {
  readonly eta: Fresco<Eta>;
  /** Ancho maximo en caracteres. Por defecto, el del design system. */
  readonly maxCaracteres?: number;
}

export function EtaCell({ eta, maxCaracteres = ETA_MAX_CHARS }: EtaCellProps) {
  if (eta.estado === 'presente') {
    const completo = formatEtaTexto(eta.valor.estimadoEn);
    const visible = truncate(completo, maxCaracteres);

    return (
      /*
       * `title` con el texto completo SIEMPRE, no solo cuando se trunca: asi la celda
       * no tiene que razonar sobre si recorto, y el dato entero esta siempre a un
       * hover de distancia.
       */
      <span title={completo} className="text-on-surface whitespace-nowrap">
        {visible}
      </span>
    );
  }

  if (eta.estado === 'ausente-por-degradacion') {
    const ultimo =
      eta.ultimoDatoEn !== null
        ? ` Ultimo dato conocido: ${formatDateTime(eta.ultimoDatoEn)} (no actualizado).`
        : '';

    return (
      /*
       * role="status" igual que en FreshnessMark: la ausencia se ANUNCIA. Una celda
       * vacia no le dice nada a un lector de pantalla, y "no lo sabemos ahora" es
       * informacion, no falta de informacion.
       */
      <span
        role="status"
        title={`${eta.motivo}.${ultimo}`}
        className="text-degradado-800 bg-degradado-50 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap"
      >
        ETA no disponible
      </span>
    );
  }

  return <span className="text-on-surface-variant whitespace-nowrap">Pendiente</span>;
}
