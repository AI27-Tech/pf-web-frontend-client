/*
 * HistorialViajesTable: la tabla del Historial, en su versión mínima apegada al
 * contrato `ViajeResumen` ({id, estado, origen}). Folio/Fecha, Ruta, Vehículo y
 * Reporte de Seguridad se retiraron con el recorte al contrato
 * (ver docs/decisiones/2026-recorte-al-contrato-bff.md).
 */

import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EstadoViaje, type ViajeResumen } from '@/lib/contracts';
import { HistorialViajesTable } from '@/features/viajes/historial/HistorialViajesTable';
import { renderConRouter } from '../support/router';

function viaje(indice: number, estado: EstadoViaje): ViajeResumen {
  return {
    id: `viaje-${indice}`,
    estado,
    origen: `Origen ${indice}`,
  };
}

/** Seis viajes: dos paginas a tres por pagina. El segundo esta cancelado. */
const viajes: readonly ViajeResumen[] = [
  viaje(1, EstadoViaje.EnTransito),
  viaje(2, EstadoViaje.Cancelado),
  viaje(3, EstadoViaje.Cerrado),
  viaje(4, EstadoViaje.EnTransito),
  viaje(5, EstadoViaje.Cerrado),
  viaje(6, EstadoViaje.Solicitado),
];

describe('HistorialViajesTable', () => {
  it('pinta las tres cabeceras de la versión mínima', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toStrictEqual([
      'ID',
      'Origen',
      'Estado',
    ]);
  });

  it('el ID enlaza al detalle del viaje', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);

    const enlace = await screen.findByRole('link', { name: 'viaje-1' });
    expect(enlace).toHaveAttribute('href', '/viajes/viaje-1');
  });

  it('un viaje cancelado se distingue por su senal de estado "alert"', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);

    const filaCancelada = (await screen.findByRole('link', { name: 'viaje-2' })).closest('tr');
    const badge = filaCancelada?.querySelector('span[class*="_badge_"]');
    expect(badge?.className).toContain('alert');
  });

  it('parte los seis registros en dos paginas y navega entre ellas', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);

    expect(await screen.findByRole('link', { name: 'viaje-1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'viaje-3' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'viaje-4' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByRole('link', { name: 'viaje-4' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'viaje-6' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'viaje-1' })).not.toBeInTheDocument();
  });

  it('sin viajes muestra un vacio explicativo en lugar de una tabla vacia', async () => {
    renderConRouter(<HistorialViajesTable viajes={[]} />);

    expect(await screen.findByText('No hay viajes en el historial')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

/*
 * La toolbar de filtros la aporta el `FilterTable` del design system. Es SOLO frontend:
 * los controles se pueden usar y conservan su valor, pero no filtran nada todavia.
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
    await userEvent.type(busqueda, 'viaje-1');

    expect(busqueda).toHaveValue('viaje-1');
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
