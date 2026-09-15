/*
 * La barra de telemetria inferior de Seguimiento en Vivo.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Eta, ViajeEnCurso } from '@/lib/contracts';
import { presente } from '@/lib/contracts';
import { TelemetriaExtraCard } from '@/features/seguimiento/TelemetriaExtraCard';

const viaje: ViajeEnCurso = {
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

describe('TelemetriaExtraCard', () => {
  it('muestra velocidad, temperatura y bateria del viaje seleccionado', () => {
    render(<TelemetriaExtraCard viaje={viaje} showDetail={false} onToggleDetail={() => {}} />);

    expect(screen.getByText('78 km/h')).toBeInTheDocument();
    expect(screen.getByText('-4°C')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('"Ver Detalles" no navega: llama a onToggleDetail', async () => {
    const onToggleDetail = vi.fn();
    render(
      <TelemetriaExtraCard viaje={viaje} showDetail={false} onToggleDetail={onToggleDetail} />,
    );

    const boton = screen.getByRole('button', { name: 'Ver Detalles' });
    expect(boton).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(boton);
    expect(onToggleDetail).toHaveBeenCalledTimes(1);
  });

  it('con el detalle abierto, el boton cambia a "Volver a Viajes Activos"', () => {
    render(<TelemetriaExtraCard viaje={viaje} showDetail onToggleDetail={() => {}} />);

    const boton = screen.getByRole('button', { name: 'Volver a Viajes Activos' });
    expect(boton).toHaveAttribute('aria-pressed', 'true');
  });

  it('sin viaje seleccionado lo dice en lugar de mostrar ceros', () => {
    render(<TelemetriaExtraCard viaje={undefined} showDetail={false} onToggleDetail={() => {}} />);

    expect(
      screen.getByText('Selecciona un viaje activo para ver su telemetria.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/km\/h/)).not.toBeInTheDocument();
  });
});
