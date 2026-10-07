/*
 * La composicion de Seguimiento en Vivo: seleccion de tarjeta y ubicacion del mapa.
 *
 * PROTOTIPO V2 (NO productivo): archivado con la superficie de seguimiento en vivo en
 * E9-T10 / F-06. Vitest no corre `prototipos-v2/`.
 */

import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ViajeEnCurso } from '../../features/viaje-activo';
import { SeguimientoSection } from '../../features/SeguimientoSection';
import { renderConRouter } from './router';
import { viajeBase } from './fixtures';

const viajes: readonly ViajeEnCurso[] = [
  { ...viajeBase, viajeId: 'viaje-1', folio: 'AI27-000101', velocidadPromedioKmh: 78 },
  { ...viajeBase, viajeId: 'viaje-2', folio: 'AI27-000102', velocidadPromedioKmh: 64 },
];

describe('SeguimientoSection', () => {
  it('la primera tarjeta esta seleccionada por defecto', async () => {
    renderConRouter(<SeguimientoSection viajes={viajes} />);

    const botones = await screen.findAllByRole('button', { name: /AI27/i });
    expect(botones[0]).toHaveAttribute('aria-pressed', 'true');
    expect(botones[1]).toHaveAttribute('aria-pressed', 'false');
  });

  it('clickear otra tarjeta cambia cual esta seleccionada', async () => {
    renderConRouter(<SeguimientoSection viajes={viajes} />);

    const botones = await screen.findAllByRole('button', { name: /AI27/i });
    await userEvent.click(botones[1] as HTMLElement);

    expect(botones[0]).toHaveAttribute('aria-pressed', 'false');
    expect(botones[1]).toHaveAttribute('aria-pressed', 'true');
  });

  it('el mapa se muestra junto a la lista', async () => {
    renderConRouter(<SeguimientoSection viajes={viajes} />);

    expect(await screen.findByRole('region', { name: 'Vista de mapa' })).toBeInTheDocument();
  });

  it('la barra de telemetria refleja el viaje seleccionado y cambia con el click', async () => {
    renderConRouter(<SeguimientoSection viajes={viajes} />);

    expect(await screen.findByText('78 km/h')).toBeInTheDocument();

    const botones = await screen.findAllByRole('button', { name: /AI27/i });
    await userEvent.click(botones[1] as HTMLElement);

    expect(screen.getByText('64 km/h')).toBeInTheDocument();
    expect(screen.queryByText('78 km/h')).not.toBeInTheDocument();
  });
});

describe('SeguimientoSection · "Ver Detalles"', () => {
  it('al pulsar "Ver Detalles" se oculta "Viajes Activos" y aparece el detalle', async () => {
    renderConRouter(<SeguimientoSection viajes={viajes} />);

    await screen.findByRole('region', { name: 'Viajes activos' });
    expect(screen.queryByRole('region', { name: 'Detalle del viaje' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ver Detalles' }));

    expect(screen.queryByRole('region', { name: 'Viajes activos' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Detalle del viaje' })).toBeInTheDocument();
    expect(screen.getByText('Más información')).toBeInTheDocument();
  });

  it('"Volver a Viajes Activos" restaura la lista y oculta el detalle', async () => {
    renderConRouter(<SeguimientoSection viajes={viajes} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Ver Detalles' }));
    await userEvent.click(screen.getByRole('button', { name: 'Volver a Viajes Activos' }));

    expect(screen.getByRole('region', { name: 'Viajes activos' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Detalle del viaje' })).not.toBeInTheDocument();
  });
});
