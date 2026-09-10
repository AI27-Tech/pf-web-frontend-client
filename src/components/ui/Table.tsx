import { useState, type ReactNode } from 'react';
import { cx } from '@/lib/utils';

export interface Column<T> {
  readonly key: string;
  readonly header: string;
  readonly cell: (row: T) => ReactNode;
}

interface TableProps<T> {
  readonly caption: string;
  readonly columns: readonly Column<T>[];
  readonly rows: readonly T[];
  readonly rowKey: (row: T) => string;
  readonly emptyMessage?: string;
  /**
   * Cabecera atenuada y en mayusculas, para tablas que viven DENTRO de una tarjeta.
   * Ahi la cabecera con fondo propio anade un segundo marco al de la tarjeta y el
   * resultado son dos cajas anidadas compitiendo.
   */
  readonly headerTone?: 'default' | 'muted';
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
}: TableProps<T>) {
  const [selectedKey, setSelectedKey] = useState<string | null>(defaultSelectedRowKey ?? null);

  if (rows.length === 0) {
    return <p className="text-on-surface-variant py-6 text-sm">{emptyMessage}</p>;
  }

  const conMarco = headerTone === 'default';

  function toggleSeleccion(key: string): void {
    if (!selectable) return;
    setSelectedKey((actual) => (actual === key ? null : key));
  }

  return (
    <div className={cx('overflow-x-auto', conMarco && 'border-outline-variant rounded-lg border')}>
      <table
        className={cx(
          'divide-outline-variant min-w-full divide-y text-sm',
          minWidthClass,
          conMarco && 'bg-surface-container-lowest',
        )}
      >
        <caption className="sr-only">{caption}</caption>
        <thead
          className={
            conMarco
              ? 'bg-surface-container text-on-surface-variant'
              : 'text-on-surface-variant text-xs uppercase'
          }
        >
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="px-3 py-2 text-left font-semibold">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-outline-variant divide-y">
          {rows.map((row) => {
            const key = rowKey(row);
            const seleccionada = selectable && selectedKey === key;

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
                  'group hover:bg-surface-container transition-colors',
                  selectable && 'cursor-pointer',
                  seleccionada && 'bg-surface-container',
                )}
              >
                {columns.map((column, indice) => (
                  <td
                    key={column.key}
                    className={cx(
                      'px-3 py-3 align-middle',
                      indice === 0 && 'border-l-2',
                      indice === 0 &&
                        (seleccionada
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
  );
}
