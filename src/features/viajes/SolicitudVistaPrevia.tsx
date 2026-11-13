/*
 * SolicitudVistaPrevia — resumen en vivo de la solicitud (E1-HU-001, E9-T4).
 *
 * Presentacional y sin estado: pinta lo que el cliente va capturando en
 * `NuevaSolicitudForm` para que confirme todo antes de enviarlo. No valida ni decide
 * nada; un dato vacío se muestra como "—". La ruta se lee de arriba abajo: Origen,
 * Destino 1..N (los únicos numerados) y Destino final, que siempre es el último.
 *
 * Es un `<aside>` con clases de utilidad y no un `Card` de `@ai27-tech/ui`: el borde
 * punteado distingue la vista previa del formulario, y el `Card` de la librería fija su
 * propio borde sólido (la librería no se modifica).
 */

import { Info } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface SolicitudVistaPreviaProps {
  /** Origen tal como se captura (texto libre). */
  readonly origen: string;
  /** Nombres de los destinos intermedios, en orden. Vacío si no hay ninguno. */
  readonly paradas: readonly string[];
  /** Destino final: siempre es el último punto de la ruta (puede estar vacío). */
  readonly destino: string;
  /** Etiqueta del tipo de servicio elegido; vacía si no se eligió ninguno. */
  readonly tipoServicio: string;
  /** Etiqueta del tipo de escolta elegido; vacía si no se eligió ninguno. */
  readonly tipoEscolta: string;
  /** "No" sin sobreescolta; con ella, la etiqueta de su tipo (vacía si aún no se elige). */
  readonly sobreescolta: string;
  /** Instante ya combinado (UTC, ISO 8601); vacío si no hay fecha y hora completas. */
  readonly fechaHora: string;
}

/** Valor o guion. El guion se anuncia como "Sin definir" para lectores de pantalla. */
function Valor({ texto }: { readonly texto: string }) {
  if (texto.trim() === '') {
    return (
      <>
        <span aria-hidden="true">—</span>
        <span className="sr-only">Sin definir</span>
      </>
    );
  }
  return <>{texto}</>;
}

function formatearFechaHora(valor: string): string {
  if (valor === '') return '';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? '' : formatDateTime(valor);
}

function textoDestinos(cantidad: number): string {
  if (cantidad === 0) return 'Ninguno';
  return cantidad === 1 ? '1 destino' : `${cantidad} destinos`;
}

export function SolicitudVistaPrevia({
  origen,
  paradas,
  destino,
  tipoServicio,
  tipoEscolta,
  sobreescolta,
  fechaHora,
}: SolicitudVistaPreviaProps) {
  // Ruta en orden: origen, destinos (los únicos numerados) y el destino final.
  const puntos = [
    { etiqueta: 'Origen', nombre: origen },
    ...paradas.map((nombre, indice) => ({ etiqueta: `Destino ${indice + 1}`, nombre })),
    { etiqueta: 'Destino final', nombre: destino },
  ];

  const filas = [
    { etiqueta: 'Tipo de servicio', valor: tipoServicio },
    { etiqueta: 'Destinos intermedios', valor: textoDestinos(paradas.length) },
    { etiqueta: 'Tipo de escolta', valor: tipoEscolta },
    { etiqueta: 'Sobreescolta', valor: sobreescolta },
    { etiqueta: 'Fecha y hora', valor: formatearFechaHora(fechaHora) },
  ];

  return (
    <aside
      aria-label="Vista previa de la solicitud"
      className="border-outline-variant bg-surface-container-lowest flex flex-col gap-4 rounded-lg border border-dashed p-5"
    >
      <header className="flex flex-col gap-1">
        <p className="text-primary text-xs font-semibold tracking-wider uppercase">Vista previa</p>
        <h2 className="text-on-surface text-base font-semibold">Resumen de tu solicitud</h2>
      </header>

      <ol className="flex flex-col gap-4">
        {puntos.map((punto, indice) => {
          const esUltimo = indice === puntos.length - 1;
          return (
            <li
              key={indice}
              className={
                'relative pl-6 ' +
                (esUltimo
                  ? ''
                  : 'before:border-outline before:absolute before:top-4 before:-bottom-4 before:left-[0.28rem] before:border-l before:border-dashed before:content-[""]')
              }
            >
              <span
                aria-hidden="true"
                className={
                  'absolute top-1 left-0 size-2.5 rounded-full border ' +
                  (esUltimo ? 'bg-primary border-primary' : 'border-outline bg-surface')
                }
              />
              <p className="text-on-surface-variant text-xs">{punto.etiqueta}</p>
              <p className="text-on-surface text-sm break-words">
                <Valor texto={punto.nombre} />
              </p>
            </li>
          );
        })}
      </ol>

      <dl className="border-outline-variant flex flex-col gap-2 border-t pt-4 text-sm">
        {filas.map((fila) => (
          <div key={fila.etiqueta} className="flex items-baseline justify-between gap-4">
            <dt className="text-on-surface-variant">{fila.etiqueta}</dt>
            <dd className="text-on-surface text-right break-words">
              <Valor texto={fila.valor} />
            </dd>
          </div>
        ))}
      </dl>

      <p className="border-outline-variant text-on-surface-variant flex items-start gap-2 border-t pt-4 text-xs">
        <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        Se actualiza conforme completas el formulario, para que confirmes todo antes de enviarlo.
      </p>
    </aside>
  );
}
