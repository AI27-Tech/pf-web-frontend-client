/*
 * Pagination: el pie de paginacion controlado.
 *
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '@/components/ui/Pagination';

describe('Pagination', () => {
  it('muestra el rango de registros y la pagina actual', () => {
    render(
      <Pagination
        page={1}
        totalPages={2}
        totalRecords={6}
        rangeStart={1}
        rangeEnd={3}
        onPageChange={() => {}}
      />,
    );

    expect(screen.getByText('Mostrando 1–3 de 6 registros')).toBeInTheDocument();
    expect(screen.getByText('Pagina 1 de 2')).toBeInTheDocument();
  });

  it('en la primera pagina, "anterior" esta deshabilitado y "siguiente" no', () => {
    render(
      <Pagination
        page={1}
        totalPages={2}
        totalRecords={6}
        rangeStart={1}
        rangeEnd={3}
        onPageChange={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Pagina anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pagina siguiente' })).toBeEnabled();
  });

  it('en la ultima pagina, "siguiente" esta deshabilitado', () => {
    render(
      <Pagination
        page={2}
        totalPages={2}
        totalRecords={6}
        rangeStart={4}
        rangeEnd={6}
        onPageChange={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Pagina siguiente' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pagina anterior' })).toBeEnabled();
  });

  it('avisa del cambio de pagina con el numero destino, no lo cambia solo', async () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        page={1}
        totalPages={2}
        totalRecords={6}
        rangeStart={1}
        rangeEnd={3}
        onPageChange={onPageChange}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Pagina siguiente' }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
