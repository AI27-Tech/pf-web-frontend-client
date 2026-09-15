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
   * paginacion automatica de `pageSize`, si ambos estan presentes.
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
  readonly pageSize?: number;
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
  pageSize,
  fill = false,
}: TableProps<T>) {
  const [selectedKey, setSelectedKey] = useState<string | null>(defaultSelectedRowKey ?? null);
  const [currentPage, setCurrentPage] = useState(1);

  if (rows.length === 0) {
    return <p className="text-on-surface-variant py-6 text-sm">{emptyMessage}</p>;
  }

  const bordered = headerTone === 'default';
  const paginated = pageSize !== undefined && pageSize > 0;

  // Se acota la pagina al rango valido: la pagina no se queda
  // fuera de rango mostrando un cuerpo vacio.
  const totalPages = paginated ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const page = Math.min(currentPage, totalPages);

  const rangeStart = paginated ? (page - 1) * pageSize + 1 : 1;
  const rangeEnd = paginated ? Math.min(page * pageSize, rows.length) : rows.length;
  const visibleRows = paginated ? rows.slice(rangeStart - 1, rangeEnd) : rows;

  function toggleSelection(key: string): void {
    if (!selectable) return;
    setSelectedKey((current) => (current === key ? null : key));
  }

  const theadClass =
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
        bordered && 'border-outline-variant rounded-lg border',
      )}
    >
      <div className={cx('overflow-x-auto', fill && 'min-h-0 flex-1')}>
        <table
          className={cx(
            'divide-outline-variant min-w-full divide-y text-sm',
            minWidthClass,
            bordered && 'bg-surface-container-lowest',
          )}
        >
          <caption className="sr-only">{caption}</caption>
          <thead className={theadClass}>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className="px-3 py-2 text-left font-semibold">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-outline-variant divide-y">
            {visibleRows.map((row) => {
              const key = rowKey(row);
              const selected = selectable && selectedKey === key;
              const tone: RowTone = rowTone?.(row) ?? 'default';
              const isError = tone === 'error';

              return (
                <tr
                  key={key}
                  onClick={selectable ? () => toggleSelection(key) : undefined}
                  // La seleccion es solo por click. `aria-selected` sigue anunciando el
                  // estado a quien usa un lector de pantalla, sin convertir la fila en
                  // una parada de tabulacion que no hace nada al activarla.
                  aria-selected={selectable ? selected : undefined}
                  className={cx(
                    // `group` deja que la primera celda reaccione al hover de la fila.
                    'group transition-colors',
                    isError ? 'bg-error-container/40' : 'hover:bg-surface-container',
                    selectable && 'cursor-pointer',
                    selected && !isError && 'bg-surface-container',
                  )}
                >
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={cx(
                        'px-3 py-3 align-middle',
                        index === 0 && 'border-l-2',
                        index === 0 &&
                          (isError
                            ? 'border-error'
                            : selected
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

      {(footer !== undefined || paginated) && (
        <div className="border-outline-variant bg-surface-container-low border-t px-3 py-3">
          {footer}
          {paginated && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalRecords={rows.length}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
