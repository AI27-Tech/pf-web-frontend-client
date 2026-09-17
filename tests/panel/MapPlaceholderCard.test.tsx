/*
 * Placeholder del mapa.
 *
 * El hueco del mapa se explica con palabras, no solo con un icono: un icono solo seria
 * un cuadro vacio para quien usa un lector de pantalla.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MapPlaceholderCard } from '@/features/panel/MapPlaceholderCard';

describe('MapPlaceholderCard', () => {
  it('el espacio se explica con palabras y el icono no se anuncia', () => {
    render(<MapPlaceholderCard />);

    // Un icono solo seria un cuadro vacio para un lector de pantalla.
    expect(screen.getByText(/La vista de mapa todavía no está disponible./i)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Vista de mapa' })).toBeInTheDocument();
  });
});
