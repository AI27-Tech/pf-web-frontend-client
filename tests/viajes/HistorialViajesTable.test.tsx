/*
 * HistorialViajesTable: la tabla del Historial, en su versión mínima apegada al
 * contrato `ViajeResumen` ({id, estado, origen}). Folio/Fecha, Ruta, Vehículo y
 * Reporte de Seguridad se retiraron con el recorte al contrato
 * (ver docs/decisiones/2026-recorte-al-contrato-bff.md).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EstadoViaje, type ViajeResumen } from '@/lib/contracts';
import { HistorialViajesTable } from '@/features/viajes/historial/HistorialViajesTable';
import { renderConRouter } from '../support/router';

/*
 * El filtro por estado navega: el select llama a `navigate({ to: '/viajes', search })`.
 * Se sustituye solo `useNavigate` por un doble para capturar esa navegacion, y se deja
 * el resto del router real (lo necesita el `Link` del ID). Asi se afirma el COMPORTAMIENTO
 * —a donde navega y con que search param— sin montar la ruta real ni su loader.
 */
const navigateMock = vi.fn();
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

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
 * Barra de filtros. El filtro por estado esta CABLEADO: al elegir un estado se navega
 * con el search param, para que el loader pida a bff la pagina ya filtrada. Lo que el
 * contrato no soporta (rango de fechas, busqueda de texto, exportar CSV) sigue
 * deshabilitado y honesto, y no se cablea.
 */
describe('HistorialViajesTable · filtro por estado (cableado al servidor)', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('elegir un estado navega a /viajes con ese estado como search param', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'CERRADO');

    expect(navigateMock).toHaveBeenCalledWith({ to: '/viajes', search: { estado: 'CERRADO' } });
  });

  it('"en curso" (EN_TRANSITO) y "cerrado" (CERRADO) navegan con estados distintos', async () => {
    // Primer render: desde "todos", elegir un estado en curso.
    const { unmount } = renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'EN_TRANSITO');
    expect(navigateMock).toHaveBeenLastCalledWith({
      to: '/viajes',
      search: { estado: 'EN_TRANSITO' },
    });
    unmount();

    // Segundo render: ya con un estado activo, cambiar a "cerrado".
    renderConRouter(<HistorialViajesTable viajes={viajes} estado={EstadoViaje.EnTransito} />);
    await screen.findByRole('table');

    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'CERRADO');
    expect(navigateMock).toHaveBeenLastCalledWith({ to: '/viajes', search: { estado: 'CERRADO' } });
  });

  it('volver a "Todos los estados" limpia el search param (navega sin estado)', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} estado={EstadoViaje.Cerrado} />);
    await screen.findByRole('table');

    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'Todos los estados');

    expect(navigateMock).toHaveBeenCalledWith({ to: '/viajes', search: {} });
  });

  it('refleja el estado activo del prop en el select, sin estado local', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} estado={EstadoViaje.Cerrado} />);
    await screen.findByRole('table');

    expect(screen.getByLabelText('Estado')).toHaveValue('CERRADO');
  });

  it('un filtro sin coincidencias conserva la toolbar para poder volver a "todos"', async () => {
    // Lista vacia PERO con filtro activo: no es "cuenta sin viajes", es "sin resultados".
    renderConRouter(<HistorialViajesTable viajes={[]} estado={EstadoViaje.Cancelado} />);

    expect(await screen.findByText('Sin resultados')).toBeInTheDocument();
    // La toolbar sigue ahi: el usuario puede cambiar el filtro.
    expect(screen.getByLabelText('Estado')).toBeInTheDocument();
  });
});

/*
 * Lo que el contrato NO soporta se queda deshabilitado y honesto. No se cablea.
 */
describe('HistorialViajesTable · controles sin contrato (deshabilitados y honestos)', () => {
  it('el rango de fechas esta presente pero inerte: todas sus opciones deshabilitadas', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    const rango = screen.getByLabelText(/Rango de fechas/);
    const opciones = Array.from(rango.querySelectorAll('option')).filter((o) => o.value !== '');
    expect(opciones.length).toBeGreaterThan(0);
    expect(opciones.every((o) => o.disabled)).toBe(true);
  });

  it('no renderiza un cuadro de busqueda: el contrato no soporta busqueda de texto', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('la toolbar no añade un boton de accion: el cambio de estado navega al instante', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    // Ni "Filtrar" ni un segundo "Exportar CSV" (ese vive en el encabezado): no hay
    // boton de accion en la toolbar de la tabla.
    expect(screen.queryByRole('button', { name: 'Filtrar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Exportar CSV' })).not.toBeInTheDocument();
  });
});
