/*
 * Pagination: el pie de paginacion del design system.
 *
 * Presentacional y controlado: no posee el numero de pagina, lo recibe y avisa de los
 * cambios por `onPageChange`.
 *
 * Muestra "Mostrando X–Y de Z registros" y "Pagina N de M". Los dos botones son
 * <button>.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '@/lib/utils';

interface PaginationProps {
  /** Pagina actual, 1-indexada. */
  readonly page: number;
  /** Total de paginas. Minimo 1. */
  readonly totalPages: number;
  /** Total de registros, para el texto "de Z registros". */
  readonly totalRecords: number;
  /** Indice (1-indexado) del primer registro visible en la pagina actual. */
  readonly rangeStart: number;
  /** Indice (1-indexado) del ultimo registro visible en la pagina actual. */
  readonly rangeEnd: number;
  readonly onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalRecords,
  rangeStart,
  rangeEnd,
  onPageChange,
}: PaginationProps) {
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Paginacion"
      className="text-on-surface-variant flex items-center justify-between gap-2 text-sm"
    >
      <p>
        Mostrando {rangeStart}–{rangeEnd} de {totalRecords} registros
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Pagina anterior"
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
          className={cx(
            'inline-flex items-center justify-center rounded-md p-1 transition-colors',
            'hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </button>

        <span className="font-medium">
          Pagina {page} de {totalPages}
        </span>

        <button
          type="button"
          aria-label="Pagina siguiente"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          className={cx(
            'inline-flex items-center justify-center rounded-md p-1 transition-colors',
            'hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </nav>
  );
}
