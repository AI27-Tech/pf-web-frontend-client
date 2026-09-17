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

  it('un viaje cancelado se distingue por su senal de estado "alert"', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);

    // El tono de fila desaparecio con la tabla de la libreria; la anomalia la comunica
    // el `Badge` de estado, que para CANCELADO usa la senal "alert".
    const filaCancelada = (await screen.findByRole('link', { name: 'AI27-000102' })).closest('tr');
    const badge = filaCancelada?.querySelector('span[class*="_badge_"]');
    expect(badge?.className).toContain('alert');
  });

  it('parte los seis registros en dos paginas y navega entre ellas', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);

    // Pagina 1: los tres primeros folios.
    expect(await screen.findByRole('link', { name: 'AI27-000101' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'AI27-000103' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'AI27-000104' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByRole('link', { name: 'AI27-000104' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'AI27-000106' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'AI27-000101' })).not.toBeInTheDocument();
  });

  it('sin viajes muestra un vacio explicativo en lugar de una tabla vacia', async () => {
    renderConRouter(<HistorialViajesTable viajes={[]} />);

    expect(await screen.findByText('No hay viajes en el historial')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

/*
 * La toolbar de filtros la aporta el `FilterTable` del design system. Es SOLO frontend:
 * los controles se pueden usar y conservan su valor, pero no filtran nada todavia. Los
 * selects toman su nombre accesible del placeholder; la busqueda, del propio FilterTable.
 */
describe('HistorialViajesTable · barra de filtros (solo frontend)', () => {
  it('ofrece los dos filtros y la busqueda con nombre accesible', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    expect(screen.getByLabelText('Rango de fechas')).toBeInTheDocument();
    expect(screen.getByLabelText('Estado')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('la busqueda conserva lo que se escribe', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    const busqueda = screen.getByRole('searchbox');
    await userEvent.type(busqueda, 'AB-123');

    expect(busqueda).toHaveValue('AB-123');
  });

  it('el filtro de estado conserva la eleccion', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    const estado = screen.getByLabelText('Estado');
    await userEvent.selectOptions(estado, 'CANCELADO');

    expect(estado).toHaveValue('CANCELADO');
  });

  it('el boton "Filtrar" esta deshabilitado: el filtrado es del servidor', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    expect(screen.getByRole('button', { name: 'Filtrar' })).toBeDisabled();
  });
});
