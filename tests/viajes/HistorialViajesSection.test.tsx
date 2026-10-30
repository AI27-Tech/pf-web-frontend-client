/*
 * HistorialViajesSection: la composicion de la pantalla.
 *
 */

import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { ViajeResumen } from '@/lib/contracts';
import { HistorialViajesSection } from '@/features/viajes/historial/HistorialViajesSection';
import { renderConRouter } from '../support/router';

const viajes: readonly ViajeResumen[] = [
  {
    id: 'viaje-1',
    estado: 'EN_TRANSITO',
    origen: 'CDMX',
  },
];

describe('HistorialViajesSection', () => {
  it('tiene un unico encabezado de nivel 1 con el titulo de la pantalla', async () => {
    renderConRouter(<HistorialViajesSection viajes={viajes} />);
    await screen.findByRole('heading', { level: 1 });

    const encabezados = screen.getAllByRole('heading', { level: 1 });
    expect(encabezados).toHaveLength(1);
    expect(encabezados[0]).toHaveTextContent('Historial de Viajes');
  });

  it('lee en orden: titulo, luego filtros, luego tabla', async () => {
    renderConRouter(<HistorialViajesSection viajes={viajes} />);

    const titulo = await screen.findByRole('heading', { level: 1 });
    const filtroEstado = screen.getByLabelText('Estado');
    const tabla = screen.getByRole('table');

    expect(titulo.compareDocumentPosition(filtroEstado)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(filtroEstado.compareDocumentPosition(tabla)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('ya no ofrece el enlace "Solicitar servicio"', async () => {
    renderConRouter(<HistorialViajesSection viajes={viajes} />);
    await screen.findByRole('heading', { level: 1 });

    expect(screen.queryByRole('link', { name: /Solicitar servicio/i })).not.toBeInTheDocument();
  });
});
