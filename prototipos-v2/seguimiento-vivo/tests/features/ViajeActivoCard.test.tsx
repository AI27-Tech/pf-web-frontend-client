/*
 * Las tarjetas de "Viajes Activos": badge de estado, porcentaje de progreso, acento
 * de ruta y la lista que las compone.
 *
 * PROTOTIPO V2 (NO productivo): archivado con la superficie de seguimiento en vivo en
 * E9-T10 / F-06. Vitest no corre `prototipos-v2/`.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ViajeEnCurso } from '../../features/viaje-activo';
import { EstadoSeguimientoBadge } from '../../features/EstadoSeguimientoBadge';
import { ViajeActivoCard } from '../../features/ViajeActivoCard';
import { ViajesActivosCard } from '../../features/ViajesActivosCard';
import { routeAccentClass } from '../../features/accentClass';
import { renderConRouter } from './router';
import { ausentePorDegradacion, sinDato, viajeBase } from './fixtures';

describe('EstadoSeguimientoBadge', () => {
  it('pinta la etiqueta que trae el wire', () => {
    render(
      <EstadoSeguimientoBadge
        estadoSeguimiento={{
          etiqueta: 'Desvío Detectado',
          tono: 'warning',
          icono: 'desvio-detectado',
        }}
      />,
    );

    expect(screen.getByText('Desvío Detectado')).toBeInTheDocument();
  });

  it('un tono desconocido se pinta en neutro en lugar de romper', () => {
    render(
      <EstadoSeguimientoBadge
        estadoSeguimiento={{ etiqueta: 'Aviso nuevo', tono: 'urgente', icono: 'sirena' }}
      />,
    );

    const badge = screen.getByText('Aviso nuevo');
    expect(badge.className).toContain('text-on-surface-variant');
  });
});

describe('routeAccentClass', () => {
  it('rota entre los tres roles de acento por indice', () => {
    expect(routeAccentClass(0)).toBe('border-l-primary');
    expect(routeAccentClass(1)).toBe('border-l-secondary');
    expect(routeAccentClass(2)).toBe('border-l-tertiary');
    expect(routeAccentClass(3)).toBe('border-l-primary');
  });
});

describe('ViajeActivoCard', () => {
  it('muestra folio, ruta, operador, ETA y el progreso como porcentaje', () => {
    render(
      <ul>
        <ViajeActivoCard viaje={viajeBase} index={0} selected onSelect={() => {}} />
      </ul>,
    );

    expect(screen.getByText('AI27-000101')).toBeInTheDocument();
    expect(screen.getByText('CDMX → Monterrey')).toBeInTheDocument();
    expect(screen.getByText('Carlos R.')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('no dibuja una barra de progreso: el progreso es solo texto', () => {
    render(
      <ul>
        <ViajeActivoCard viaje={viajeBase} index={0} selected onSelect={() => {}} />
      </ul>,
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('acota un progreso fuera de rango en lugar de mostrar un porcentaje imposible', () => {
    const viaje = { ...viajeBase, progresoPct: 140 };
    render(
      <ul>
        <ViajeActivoCard viaje={viaje} index={0} selected onSelect={() => {}} />
      </ul>,
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('no incluye el enlace "Ver Detalles": esa navegacion vive solo en la barra de telemetria', () => {
    render(
      <ul>
        <ViajeActivoCard viaje={viajeBase} index={0} selected onSelect={() => {}} />
      </ul>,
    );

    expect(screen.queryByRole('link', { name: /Ver Detalles/i })).not.toBeInTheDocument();
  });

  it('un ETA ausente por degradacion se anuncia como tal, no como una hora', () => {
    const viaje = { ...viajeBase, eta: ausentePorDegradacion() };
    render(
      <ul>
        <ViajeActivoCard viaje={viaje} index={0} selected={false} onSelect={() => {}} />
      </ul>,
    );

    expect(screen.getByText('ETA no disponible')).toBeInTheDocument();
  });

  it('un viaje recien solicitado muestra "Pendiente" y no una hora inventada', () => {
    const viaje = { ...viajeBase, eta: sinDato() };
    render(
      <ul>
        <ViajeActivoCard viaje={viaje} index={0} selected={false} onSelect={() => {}} />
      </ul>,
    );

    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('el click en la tarjeta llama a onSelect', async () => {
    const onSelect = vi.fn();
    render(
      <ul>
        <ViajeActivoCard viaje={viajeBase} index={0} selected={false} onSelect={onSelect} />
      </ul>,
    );

    await userEvent.click(screen.getByRole('button', { pressed: false }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe('ViajesActivosCard', () => {
  const viajes: readonly ViajeEnCurso[] = [
    viajeBase,
    { ...viajeBase, viajeId: 'viaje-2', folio: 'AI27-000102', estado: 'EN_RUTA' },
    { ...viajeBase, viajeId: 'viaje-3', folio: 'AI27-000103', estado: 'SOLICITADO' },
  ];

  it('cuenta cuantos viajes estan EN_RUTA', async () => {
    renderConRouter(
      <ViajesActivosCard viajes={viajes} selectedViajeId="viaje-1" onSelect={() => {}} />,
    );

    expect(await screen.findByText('2 En Ruta')).toBeInTheDocument();
  });

  it('sin viajes activos lo dice en lugar de dejar la tarjeta vacia', async () => {
    renderConRouter(
      <ViajesActivosCard viajes={[]} selectedViajeId={undefined} onSelect={() => {}} />,
    );

    expect(await screen.findByText('No hay viajes activos')).toBeInTheDocument();
  });
});
