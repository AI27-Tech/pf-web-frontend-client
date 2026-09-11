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
        pagina={1}
        totalPaginas={2}
        totalRegistros={6}
        desde={1}
        hasta={3}
        onCambiarPagina={() => {}}
      />,
    );

    expect(screen.getByText('Mostrando 1–3 de 6 registros')).toBeInTheDocument();
    expect(screen.getByText('Pagina 1 de 2')).toBeInTheDocument();
  });

  it('en la primera pagina, "anterior" esta deshabilitado y "siguiente" no', () => {
    render(
      <Pagination
        pagina={1}
        totalPaginas={2}
        totalRegistros={6}
        desde={1}
        hasta={3}
        onCambiarPagina={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Pagina anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pagina siguiente' })).toBeEnabled();
  });

  it('en la ultima pagina, "siguiente" esta deshabilitado', () => {
    render(
      <Pagination
        pagina={2}
        totalPaginas={2}
        totalRegistros={6}
        desde={4}
        hasta={6}
        onCambiarPagina={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Pagina siguiente' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pagina anterior' })).toBeEnabled();
  });

  it('avisa del cambio de pagina con el numero destino, no lo cambia solo', async () => {
    const onCambiarPagina = vi.fn();
    render(
      <Pagination
        pagina={1}
        totalPaginas={2}
        totalRegistros={6}
        desde={1}
        hasta={3}
        onCambiarPagina={onCambiarPagina}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Pagina siguiente' }));

    expect(onCambiarPagina).toHaveBeenCalledWith(2);
  });
});
