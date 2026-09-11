/*
 * HistorialFiltros: la barra de filtros, que hoy es SOLO frontend.
 *
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistorialFiltros } from '@/features/viajes/historial/HistorialFiltros';

describe('HistorialFiltros', () => {
  it('los tres campos tienen nombre accesible', () => {
    render(<HistorialFiltros />);

    expect(screen.getByLabelText('Rango de fechas')).toBeInTheDocument();
    expect(screen.getByLabelText('Estado')).toBeInTheDocument();
    expect(screen.getByLabelText('Busqueda rapida')).toBeInTheDocument();
  });

  it('la busqueda conserva lo que se escribe', async () => {
    render(<HistorialFiltros />);

    const busqueda = screen.getByLabelText('Busqueda rapida');
    await userEvent.type(busqueda, 'AB-123');

    expect(busqueda).toHaveValue('AB-123');
  });

  it('el select de estado conserva la eleccion', async () => {
    render(<HistorialFiltros />);

    const estado = screen.getByLabelText('Estado');
    await userEvent.selectOptions(estado, 'CANCELADO');

    expect(estado).toHaveValue('CANCELADO');
  });
});
