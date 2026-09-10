/*
 * Las tarjetas de "Viajes Activos": badge de estado, porcentaje de progreso, acento
 * de ruta y la lista que las compone.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Eta, ViajeEnCurso } from '@/lib/contracts';
import { ausentePorDegradacion, presente, sinDato } from '@/lib/contracts';
import { EstadoSeguimientoBadge } from '@/features/seguimiento/EstadoSeguimientoBadge';
import { ViajeActivoCard } from '@/features/seguimiento/ViajeActivoCard';
import { ViajesActivosCard } from '@/features/seguimiento/ViajesActivosCard';
import { accentoDeRuta } from '@/features/seguimiento/rutaAccent';
import { renderConRouter } from '../support/router';

const viajeBase: ViajeEnCurso = {
  viajeId: 'viaje-1',
  folio: 'AI27-000101',
  origen: 'CDMX',
  destino: 'Monterrey',
  estado: 'EN_RUTA',
  condicionesActivas: [],
  eta: presente<Eta>(
    { objetivo: 'destino', estimadoEn: '2026-09-09T18:30:00Z' },
    '2026-09-09T12:00:00Z',
  ),
  operadorNombre: 'Carlos R.',
  progresoPct: 65,
  estadoSeguimiento: { etiqueta: 'Ruta Segura', tono: 'success', icono: 'ruta-segura' },
  velocidadPromedioKmh: 78,
  temperaturaCargaC: -4,
  bateriaGpsPct: 92,
};

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

describe('accentoDeRuta', () => {
  it('rota entre los tres roles de acento por indice', () => {
    expect(accentoDeRuta(0)).toBe('border-l-primary');
    expect(accentoDeRuta(1)).toBe('border-l-secondary');
    expect(accentoDeRuta(2)).toBe('border-l-tertiary');
    expect(accentoDeRuta(3)).toBe('border-l-primary');
  });
});

describe('ViajeActivoCard', () => {
  it('muestra folio, ruta, operador, ETA y el progreso como porcentaje', () => {
    render(
      <ul>
        <ViajeActivoCard viaje={viajeBase} indice={0} seleccionada onSeleccionar={() => {}} />
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
        <ViajeActivoCard viaje={viajeBase} indice={0} seleccionada onSeleccionar={() => {}} />
      </ul>,
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('acota un progreso fuera de rango en lugar de mostrar un porcentaje imposible', () => {
    const viaje = { ...viajeBase, progresoPct: 140 };
    render(
      <ul>
        <ViajeActivoCard viaje={viaje} indice={0} seleccionada onSeleccionar={() => {}} />
      </ul>,
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('no incluye el enlace "Ver Detalles": esa navegacion vive solo en la barra de telemetria', () => {
    render(
      <ul>
        <ViajeActivoCard viaje={viajeBase} indice={0} seleccionada onSeleccionar={() => {}} />
      </ul>,
    );

    expect(screen.queryByRole('link', { name: /Ver Detalles/i })).not.toBeInTheDocument();
  });

  it('un ETA ausente por degradacion se anuncia como tal, no como una hora', () => {
    const viaje = {
      ...viajeBase,
      eta: ausentePorDegradacion<Eta>('procesamiento no disponible', null),
    };
    render(
      <ul>
        <ViajeActivoCard viaje={viaje} indice={0} seleccionada={false} onSeleccionar={() => {}} />
      </ul>,
    );

    expect(screen.getByText('ETA no disponible')).toBeInTheDocument();
  });

  it('un viaje recien solicitado muestra "Pendiente" y no una hora inventada', () => {
    const viaje = { ...viajeBase, eta: sinDato<Eta>() };
    render(
      <ul>
        <ViajeActivoCard viaje={viaje} indice={0} seleccionada={false} onSeleccionar={() => {}} />
      </ul>,
    );

    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('el click en la tarjeta llama a onSeleccionar', async () => {
    const onSeleccionar = vi.fn();
    render(
      <ul>
        <ViajeActivoCard
          viaje={viajeBase}
          indice={0}
          seleccionada={false}
          onSeleccionar={onSeleccionar}
        />
      </ul>,
    );

    await userEvent.click(screen.getByRole('button', { pressed: false }));
    expect(onSeleccionar).toHaveBeenCalledTimes(1);
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
      <ViajesActivosCard viajes={viajes} viajeSeleccionadoId="viaje-1" onSeleccionar={() => {}} />,
    );

    expect(await screen.findByText('2 En Ruta')).toBeInTheDocument();
  });

  it('sin viajes activos lo dice en lugar de dejar la tarjeta vacia', async () => {
    renderConRouter(
      <ViajesActivosCard viajes={[]} viajeSeleccionadoId={undefined} onSeleccionar={() => {}} />,
    );

    expect(await screen.findByText('No hay viajes activos')).toBeInTheDocument();
  });
});
