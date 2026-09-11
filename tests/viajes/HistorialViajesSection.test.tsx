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
    folio: 'AI27-000101',
    estado: 'EN_RUTA',
    origen: 'CDMX',
    origenSitio: 'Almacen Central',
    destino: 'Monterrey',
    destinoSitio: 'Planta Sur',
    solicitadoEn: '2026-09-07T08:15:00Z',
    unidad: { descripcion: 'Volvo FH16', placa: 'AB-123', conductorNombre: 'Juan Perez' },
    reporteSeguridad: 'SIN_INCIDENCIAS',
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
    const filtrar = screen.getByRole('button', { name: 'Filtrar' });
    const tabla = screen.getByRole('table');

    expect(titulo.compareDocumentPosition(filtrar)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(filtrar.compareDocumentPosition(tabla)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('ya no ofrece el enlace "Solicitar servicio"', async () => {
    renderConRouter(<HistorialViajesSection viajes={viajes} />);
    await screen.findByRole('heading', { level: 1 });

    expect(screen.queryByRole('link', { name: /Solicitar servicio/i })).not.toBeInTheDocument();
  });
});
