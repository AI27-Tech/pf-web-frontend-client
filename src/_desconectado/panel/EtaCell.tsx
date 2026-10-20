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

import { Badge } from '@ai27-tech/ui';
import type { Eta, Fresco } from '@/lib/contracts';
import { ETA_MAX_CHARS } from '@/lib/constants';
import { formatEtaText } from '@/_desconectado/panel/formatEta';
import { formatDateTime, truncate } from '@/lib/utils';

interface EtaCellProps {
  readonly eta: Fresco<Eta>;
  /** Ancho maximo en caracteres. Por defecto, el del design system. */
  readonly maxChars?: number;
}

export function EtaCell({ eta, maxChars = ETA_MAX_CHARS }: EtaCellProps) {
  if (eta.estado === 'presente') {
    const full = formatEtaText(eta.valor.estimadoEn);
    const truncated = truncate(full, maxChars);

    return (
      /*
       * `title` con el texto completo SIEMPRE, no solo cuando se trunca: asi la celda
       * no tiene que razonar sobre si recorto, y el dato entero esta siempre a un
       * hover de distancia.
       */
      <span title={full} className="text-on-surface whitespace-nowrap">
        {truncated}
      </span>
    );
  }

  if (eta.estado === 'ausente-por-degradacion') {
    const lastKnown =
      eta.ultimoDatoEn !== null
        ? ` Ultimo dato conocido: ${formatDateTime(eta.ultimoDatoEn)} (no actualizado).`
        : '';

    return (
      /*
       * `Badge` de la libreria (@ai27-tech/ui) como senal del estado degradado. La
       * variante `warning` es la mas cercana en la paleta de la libreria a la antigua
       * pastilla `degradado-*` del portal; la libreria no expone hoy una senal propia
       * de "dato stale". TODO(ui-lib): variante o token `degradado`/`stale` en la
       * libreria para no reutilizar `warning`.
       *
       * Se conservan `role="status"` y el `title` con motivo + ultimo dato: la ausencia
       * se ANUNCIA. Una celda que no dice nada seria "el mapa que miente".
       */
      <Badge
        variant="warning"
        role="status"
        title={`${eta.motivo}.${lastKnown}`}
        className="whitespace-nowrap"
      >
        ETA no disponible
      </Badge>
    );
  }

  return <span className="text-on-surface-variant whitespace-nowrap">Pendiente</span>;
}
