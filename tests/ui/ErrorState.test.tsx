/*
 * ErrorState: para el cliente, un viaje ajeno y uno inexistente son el mismo 404
 * (DEC-132). La pantalla lo dice como "no encontrado", no como un fallo del sistema.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorState } from '@/components/ui/ErrorState';
import { ApiError } from '@/lib/api/errors';

describe('ErrorState', () => {
  it('un 404 se presenta como "no encontrado", no como fallo', () => {
    render(<ErrorState error={new ApiError('noEncontrado', 'GET /viajes/x', 404, null)} />);

    expect(screen.getByRole('alert')).toHaveTextContent('No encontramos lo que buscas');
    expect(screen.queryByText('Algo se rompió')).toBeNull();
  });

  it('un error sin clasificar sigue siendo un fallo', () => {
    render(<ErrorState error={new ApiError('roto', 'GET /viajes/x', 500, null)} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Algo se rompió');
    expect(screen.getByRole('alert')).toHaveTextContent('Se registró el fallo.');
  });

  it('un servicio degradado se presenta como aviso, no como fallo del usuario', () => {
    render(<ErrorState error={new ApiError('degradado', 'GET /viajes/x', 503, null)} />);
    expect(screen.getByRole('alert')).toHaveTextContent('No podemos mostrar esto ahora mismo');
    expect(screen.queryByText('Algo se rompió')).toBeNull();
  });
});
