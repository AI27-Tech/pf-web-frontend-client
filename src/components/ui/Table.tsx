import { useState, type ReactNode } from 'react';
import { cx } from '@/lib/utils';
import { Pagination } from './Pagination';

export interface Column<T> {
  readonly key: string;
  readonly header: string;
  readonly cell: (row: T) => ReactNode;
}

/** Tono de una fila. `error` la resalta (fondo suave y acento izquierdo de error). */
type RowTone = 'default' | 'error';

interface TableProps<T> {
  readonly caption: string;
  readonly columns: readonly Column<T>[];
  readonly rows: readonly T[];
  readonly rowKey: (row: T) => string;
  readonly emptyMessage?: string;
  /**
   * Estilo de la cabecera:
   *   - `default`: cabecera con fondo propio y la tabla enmarcada. Para tablas sueltas.
   *   - `muted`: cabecera atenuada en mayusculas, SIN marco. Para tablas DENTRO de una
   *     tarjeta: ahi un marco propio anadiria una segunda caja sobre la de la tarjeta.
   *   - `filled`: banda de cabecera rellena en mayusculas, sin marco. Como `muted`
   *     pero con fondo, para el ritmo de banda/contenido/banda del Historial.
   */
  readonly headerTone?: 'default' | 'muted' | 'filled';
  readonly selectable?: boolean;
  /**
   * Fila seleccionada al montar, identificada por su `rowKey`. Sigue siendo
   * togglable despues: no fija la seleccion, solo la inicia.
   */
  readonly defaultSelectedRowKey?: string;
  /**
   * Ancho minimo del contenido. Por debajo de el, el contenedor scrollea en lugar de
   * comprimir las columnas hasta romper las palabras.
   */
  readonly minWidthClass?: string;
  /** Tono por fila, p. ej. resaltar en `error` una fila cancelada. */
  readonly rowTone?: (row: T) => RowTone;
  /**
   * Contenido del pie, dentro del marco y con borde superior. Se pinta ademas de la
   * paginacion automatica de `porPagina`, si ambos estan presentes.
   */
  readonly footer?: ReactNode;
  /**
   * Registros por pagina. Cuando llega, la tabla PAGINA: posee el numero de pagina,
   * recorta las filas visibles y pinta `Pagination` en el pie.
   *
   * La pagina vive aqui como estado de UI a proposito: hoy el servidor entrega la
   * lista completa. TODO(contracts): cuando bff pagine, esto se mueve a un search
   * param de la ruta + loaderDeps, y la tabla vuelve a recibir solo la pagina actual.
   */
  readonly porPagina?: number;
  /**
   * Estira la tabla para ocupar la altura de su contenedor: el area de filas crece y
   * el pie queda anclado abajo. Sin esto la tabla mide solo su contenido. Requiere que
   * el contenedor le de altura.
   */
  readonly fill?: boolean;
}

export function Table<T>({
  caption,
  columns,
  rows,
  rowKey,
  emptyMessage = 'Sin resultados.',
  headerTone = 'default',
  selectable = false,
  defaultSelectedRowKey,
  minWidthClass,
  rowTone,
  footer,
  porPagina,
  fill = false,
}: TableProps<T>) {
  const [selectedKey, setSelectedKey] = useState<string | null>(defaultSelectedRowKey ?? null);
  const [paginaActual, setPaginaActual] = useState(1);

  if (rows.length === 0) {
    return <p className="text-on-surface-variant py-6 text-sm">{emptyMessage}</p>;
  }

  const conMarco = headerTone === 'default';
  const paginado = porPagina !== undefined && porPagina > 0;

  // Se acota la pagina al rango valido: la pagina no se queda
  // fuera de rango mostrando un cuerpo vacio.
  const totalPaginas = paginado ? Math.max(1, Math.ceil(rows.length / porPagina)) : 1;
  const pagina = Math.min(paginaActual, totalPaginas);

  const desde = paginado ? (pagina - 1) * porPagina + 1 : 1;
  const hasta = paginado ? Math.min(pagina * porPagina, rows.length) : rows.length;
  const filasVisibles = paginado ? rows.slice(desde - 1, hasta) : rows;

  function toggleSeleccion(key: string): void {
    if (!selectable) return;
    setSelectedKey((actual) => (actual === key ? null : key));
  }

  const theadClase =
    headerTone === 'default'
      ? 'bg-surface-container text-on-surface-variant'
      : headerTone === 'filled'
        ? 'bg-surface-container-low text-on-surface-variant text-xs uppercase'
        : 'text-on-surface-variant text-xs uppercase';

  return (
    <div
      className={cx(
        'flex flex-col',
        fill && 'min-h-0 flex-1',
        conMarco && 'border-outline-variant rounded-lg border',
      )}
    >
      <div className={cx('overflow-x-auto', fill && 'min-h-0 flex-1')}>
        <table
          className={cx(
            'divide-outline-variant min-w-full divide-y text-sm',
            minWidthClass,
            conMarco && 'bg-surface-container-lowest',
          )}
        >
          <caption className="sr-only">{caption}</caption>
          <thead className={theadClase}>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className="px-3 py-2 text-left font-semibold">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-outline-variant divide-y">
            {filasVisibles.map((row) => {
              const key = rowKey(row);
              const seleccionada = selectable && selectedKey === key;
              const tono: RowTone = rowTone?.(row) ?? 'default';
              const esError = tono === 'error';

              return (
                <tr
                  key={key}
                  onClick={selectable ? () => toggleSeleccion(key) : undefined}
                  // La seleccion es solo por click. `aria-selected` sigue anunciando el
                  // estado a quien usa un lector de pantalla, sin convertir la fila en
                  // una parada de tabulacion que no hace nada al activarla.
                  aria-selected={selectable ? seleccionada : undefined}
                  className={cx(
                    // `group` deja que la primera celda reaccione al hover de la fila.
                    'group transition-colors',
                    esError ? 'bg-error-container/40' : 'hover:bg-surface-container',
                    selectable && 'cursor-pointer',
                    seleccionada && !esError && 'bg-surface-container',
                  )}
                >
                  {columns.map((column, indice) => (
                    <td
                      key={column.key}
                      className={cx(
                        'px-3 py-3 align-middle',
                        indice === 0 && 'border-l-2',
                        indice === 0 &&
                          (esError
                            ? 'border-error'
                            : seleccionada
                              ? 'border-primary'
                              : 'group-hover:border-primary border-transparent'),
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(footer !== undefined || paginado) && (
        <div className="border-outline-variant bg-surface-container-low border-t px-3 py-3">
          {footer}
          {paginado && (
            <Pagination
              pagina={pagina}
              totalPaginas={totalPaginas}
              totalRegistros={rows.length}
              desde={desde}
              hasta={hasta}
              onCambiarPagina={setPaginaActual}
            />
          )}
        </div>
      )}
    </div>
  );
}
