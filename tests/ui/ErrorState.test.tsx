/*
 * ErrorState: para el cliente, un viaje ajeno y uno inexistente son el mismo 404
 * (DEC-132). La pantalla lo dice como "no encontrado", no como un fallo del sistema.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorState } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/api/errors';

describe('ErrorState', () => {
  it('un 404 se presenta como "no encontrado", no como fallo', () => {
    render(<ErrorState error={new ApiError('noEncontrado', 'GET /viajes/x', 404, null)} />);

    expect(screen.getByRole('alert')).toHaveTextContent('No encontramos lo que buscas');
    expect(screen.queryByText('Algo se rompio')).toBeNull();
  });

  it('un error sin clasificar sigue siendo un fallo', () => {
    render(<ErrorState error={new ApiError('roto', 'GET /viajes/x', 500, null)} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Algo se rompio');
  });
});
