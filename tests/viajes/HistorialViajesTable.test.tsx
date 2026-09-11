/*
 * HistorialViajesTable: la tabla del Historial.
 */

import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ViajeResumen } from '@/lib/contracts';
import { HistorialViajesTable } from '@/features/viajes/historial/HistorialViajesTable';
import { renderConRouter } from '../support/router';

function viaje(indice: number, estado: string): ViajeResumen {
  return {
    id: `viaje-${indice}`,
    folio: `AI27-00010${indice}`,
    estado,
    origen: `Origen ${indice}`,
    origenSitio: `Sitio origen ${indice}`,
    destino: `Destino ${indice}`,
    destinoSitio: `Sitio destino ${indice}`,
    solicitadoEn: '2026-09-07T08:15:00Z',
    unidad: {
      descripcion: 'Volvo FH16',
      placa: `AB-${indice}`,
      conductorNombre: `Chofer ${indice}`,
    },
    reporteSeguridad: 'SIN_INCIDENCIAS',
  };
}

/** Seis viajes: dos paginas a tres por pagina. El segundo esta cancelado. */
const viajes: readonly ViajeResumen[] = [
  viaje(1, 'EN_RUTA'),
  viaje(2, 'CANCELADO'),
  viaje(3, 'COMPLETADO'),
  viaje(4, 'EN_RUTA'),
  viaje(5, 'COMPLETADO'),
  viaje(6, 'SOLICITADO'),
];

describe('HistorialViajesTable', () => {
  it('pinta las cinco cabeceras del diseno', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toStrictEqual([
      'ID / Fecha',
      'Ruta (Origen → Destino)',
      'Vehiculo / Conductor',
      'Reporte Seguridad',
      'Estado',
    ]);
  });

  it('el folio enlaza al detalle del viaje', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);

    const enlace = await screen.findByRole('link', { name: 'AI27-000101' });
    expect(enlace).toHaveAttribute('href', '/viajes/viaje-1');
  });

  it('un viaje cancelado resalta su fila en tono de error', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);

    const filaCancelada = (await screen.findByRole('link', { name: 'AI27-000102' })).closest('tr');
    expect(filaCancelada?.className).toContain('bg-error-container/40');
  });

  it('parte los seis registros en dos paginas y navega entre ellas', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);

    // Pagina 1: los tres primeros folios.
    expect(await screen.findByRole('link', { name: 'AI27-000101' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'AI27-000103' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'AI27-000104' })).not.toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–3 de 6 registros')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Pagina siguiente' }));

    expect(screen.getByRole('link', { name: 'AI27-000104' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'AI27-000106' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'AI27-000101' })).not.toBeInTheDocument();
    expect(screen.getByText('Mostrando 4–6 de 6 registros')).toBeInTheDocument();
  });

  it('sin viajes muestra un vacio explicativo en lugar de una tabla vacia', async () => {
    renderConRouter(<HistorialViajesTable viajes={[]} />);

    expect(await screen.findByText('No hay viajes en el historial')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
