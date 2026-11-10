/*
 * HistorialViajesTable: la tabla del Historial, en su versión mínima apegada al
 * contrato `ViajeResumen` ({id, estado, origen}). Folio/Fecha, Ruta, Vehículo y
 * Reporte de Seguridad se retiraron con el recorte al contrato
 * (ver docs/decisiones/2026-recorte-al-contrato-bff.md).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EstadoViaje, type ViajeResumen } from '@/lib/contracts';
import {
  HISTORIAL_PAGE_SIZE,
  HistorialViajesTable,
} from '@/features/viajes/historial/HistorialViajesTable';
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

function grupoDeFiltro(nombre: string): HTMLElement {
  return screen.getByRole('group', { name: nombre });
}

/** Abre el filtro y pulsa la opción con ese nombre. */
async function elegirEnFiltro(nombre: string, opcion: string): Promise<void> {
  const grupo = grupoDeFiltro(nombre);
  await userEvent.click(within(grupo).getByRole('button'));
  await userEvent.click(within(grupo).getByRole('button', { name: opcion }));
}

function muchosViajes(total: number): readonly ViajeResumen[] {
  return Array.from({ length: total }, (_, i) => viaje(i + 1, EstadoViaje.EnTransito));
}

function viaje(indice: number, estado: EstadoViaje): ViajeResumen {
  return {
    id: `viaje-${indice}`,
    estado,
    origen: `Origen ${indice}`,
  };
}
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

  it('con pocos viajes (6) caben en una sola pagina y la paginacion sigue visible', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    expect(screen.getAllByRole('link', { name: /^viaje-/ })).toHaveLength(6);
    // El conteo y las paginas se ven siempre, tambien con una sola pagina.
    const paginacion = screen.getByRole('navigation', { name: 'Pagination' });
    expect(paginacion).toHaveTextContent('1–6 of 6');
    expect(within(paginacion).getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
  });

  it('con un filtro sin resultados no hay nada que contar: se oculta la paginacion', async () => {
    renderConRouter(<HistorialViajesTable viajes={[]} estado={EstadoViaje.Cancelado} />);
    await screen.findByText('Sin resultados');

    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('sin viajes muestra un vacio explicativo en lugar de una tabla vacia', async () => {
    renderConRouter(<HistorialViajesTable viajes={[]} />);

    expect(await screen.findByText('No hay viajes en el historial')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

/*
 * Tamaño de página: la lista crece hasta 10 viajes y, a partir del 11, se pagina.
 */
describe('HistorialViajesTable · crece hasta 10 y despues pagina', () => {
  it('el tamano de pagina es 10', () => {
    expect(HISTORIAL_PAGE_SIZE).toBe(10);
  });

  it('con exactamente 10 viajes caben todos en una pagina: "1–10 of 10"', async () => {
    renderConRouter(<HistorialViajesTable viajes={muchosViajes(10)} />);
    await screen.findByRole('table');

    expect(screen.getAllByRole('link', { name: /^viaje-/ })).toHaveLength(10);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toHaveTextContent('1–10 of 10');
    // Una sola pagina: no hay a donde avanzar.
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('con 11 viajes aparece la segunda pagina: 10 en la primera y 1 en la segunda', async () => {
    renderConRouter(<HistorialViajesTable viajes={muchosViajes(11)} />);
    await screen.findByRole('table');

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toHaveTextContent('1–10 of 11');
    expect(screen.getAllByRole('link', { name: /^viaje-/ })).toHaveLength(10);
    expect(screen.queryByRole('link', { name: 'viaje-11' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toHaveTextContent('11–11 of 11');
    expect(screen.getAllByRole('link', { name: /^viaje-/ })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'viaje-11' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'viaje-1' })).not.toBeInTheDocument();
  });

  it('con 21 viajes hay tres paginas (10, 10 y 1) y se puede volver', async () => {
    renderConRouter(<HistorialViajesTable viajes={muchosViajes(21)} />);
    await screen.findByRole('table');

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toHaveTextContent('11–20 of 21');
    expect(screen.getAllByRole('link', { name: /^viaje-/ })).toHaveLength(10);

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toHaveTextContent('21–21 of 21');
    expect(screen.getAllByRole('link', { name: /^viaje-/ })).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toHaveTextContent('11–20 of 21');
  });

  it('cambiar de filtro vuelve a la primera pagina', async () => {
    renderConRouter(<HistorialViajesTable viajes={muchosViajes(21)} />);
    await screen.findByRole('table');
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toHaveTextContent('11–20 of 21');

    await elegirEnFiltro('Estado', 'Cerrado');

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toHaveTextContent('1–10 of 21');
  });
});

/*
 * Columnas del listado: las que trae el contrato (`ViajeResumen`).
 */
describe('HistorialViajesTable · columnas', () => {
  it('no pinta Destino: el contrato no lo trae en el listado (brecha contractual)', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    expect(screen.queryByRole('columnheader', { name: /destino/i })).not.toBeInTheDocument();
  });
});

/*
 * Barra de filtros. El filtro por estado esta CABLEADO: al elegir un estado se navega
 * con el search param, para que el loader pida a bff la pagina ya filtrada. Lo que el
 * contrato no soporta (rango de fechas, busqueda de texto) sigue deshabilitado.
 */
describe('HistorialViajesTable · filtro por estado (cableado al servidor)', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('elegir un estado navega a /viajes con ese estado como search param', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    await elegirEnFiltro('Estado', 'Cerrado');

    expect(navigateMock).toHaveBeenCalledWith({ to: '/viajes', search: { estado: 'CERRADO' } });
  });

  it('"en curso" (EN_TRANSITO) y "cerrado" (CERRADO) navegan con estados distintos', async () => {
    // Primer render: desde "todos", elegir un estado en curso.
    const { unmount } = renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    await elegirEnFiltro('Estado', 'En tránsito');
    expect(navigateMock).toHaveBeenLastCalledWith({
      to: '/viajes',
      search: { estado: 'EN_TRANSITO' },
    });
    unmount();

    // Segundo render: ya con un estado activo, cambiar a "cerrado".
    renderConRouter(<HistorialViajesTable viajes={viajes} estado={EstadoViaje.EnTransito} />);
    await screen.findByRole('table');

    await elegirEnFiltro('Estado', 'Cerrado');
    expect(navigateMock).toHaveBeenLastCalledWith({ to: '/viajes', search: { estado: 'CERRADO' } });
  });

  it('volver a "Todos los estados" limpia el search param (navega sin estado)', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} estado={EstadoViaje.Cerrado} />);
    await screen.findByRole('table');

    await elegirEnFiltro('Estado', 'Todos los estados');

    expect(navigateMock).toHaveBeenCalledWith({ to: '/viajes', search: {} });
  });

  it('refleja el estado activo del prop en el select, sin estado local', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} estado={EstadoViaje.Cerrado} />);
    await screen.findByRole('table');

    expect(within(grupoDeFiltro('Estado')).getByRole('button')).toHaveTextContent('Cerrado');
  });

  it('un filtro sin coincidencias conserva la toolbar para poder volver a "todos"', async () => {
    // Lista vacia PERO con filtro activo: no es "cuenta sin viajes", es "sin resultados".
    renderConRouter(<HistorialViajesTable viajes={[]} estado={EstadoViaje.Cancelado} />);

    expect(await screen.findByText('Sin resultados')).toBeInTheDocument();
    // La toolbar sigue ahi: el usuario puede cambiar el filtro.
    expect(grupoDeFiltro('Estado')).toBeInTheDocument();
  });
});

/*
 * Lo que el contrato NO soporta se queda deshabilitado y honesto. No se cablea.
 */
describe('HistorialViajesTable · controles sin contrato (deshabilitados y honestos)', () => {
  it('el rango de fechas esta presente pero inerte: todas sus opciones deshabilitadas', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    const rango = grupoDeFiltro('Rango de fechas');
    await userEvent.click(within(rango).getByRole('button'));
    for (const nombre of ['Ultimos 7 dias', 'Ultimos 30 dias', 'Ultimos 90 dias']) {
      expect(within(rango).getByRole('button', { name: nombre })).toBeDisabled();
    }
  });

  it('no renderiza un cuadro de busqueda: el contrato no soporta busqueda de texto', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('la toolbar no añade un boton de accion: el cambio de estado navega al instante', async () => {
    renderConRouter(<HistorialViajesTable viajes={viajes} />);
    await screen.findByRole('table');

    expect(screen.queryByRole('button', { name: 'Filtrar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Exportar CSV' })).not.toBeInTheDocument();
  });
});
