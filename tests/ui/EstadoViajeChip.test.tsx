/*
 * El chip de estado, probado por lo que NO debe hacer: inventar estados.
 *
 * `lib/contracts/estados.ts` solo confirma SOLICITADO. El chip tiene que dar los tres
 * tonos que el diseno pide sin declarar codigos que el contrato no tiene, y tiene que
 * mostrar un codigo desconocido en lugar de disfrazarlo. El ultimo test es el que
 * protege esa propiedad.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EstadoViajeChip } from '@/features/viajes/EstadoViajeChip';

const condicionRetrasado = {
  codigo: 'RETRASADO',
  descripcion: 'Retrasado',
  desde: '2026-09-09T10:20:00Z',
} as const;

describe('EstadoViajeChip', () => {
  it('EN_RUTA sin condiciones se presenta en tono de exito', () => {
    render(<EstadoViajeChip estado="EN_RUTA" />);

    const chip = screen.getByText('En Ruta');
    expect(chip).toBeInTheDocument();
    expect(chip.className).toContain('bg-success-container');
    expect(chip.className).toContain('text-on-success-container');
  });

  it('SOLICITADO se presenta en tono informativo', () => {
    render(<EstadoViajeChip estado="SOLICITADO" />);

    const chip = screen.getByText('Solicitado');
    expect(chip.className).toContain('bg-info-container');
  });

  it('una condicion activa gana al estado y se convierte en la etiqueta', () => {
    render(<EstadoViajeChip estado="EN_RUTA" condicionesActivas={[condicionRetrasado]} />);

    /*
     * La condicion se superpone al estado de progreso (§C.2): en una fila de una
     * linea, la anomalia es lo que el operador necesita ver, no que sigue "en ruta".
     */
    const chip = screen.getByText('Retrasado');
    expect(chip.className).toContain('bg-warning-container');
    expect(screen.queryByText('En Ruta')).not.toBeInTheDocument();
  });

  it('COMPLETADO se presenta en tono informativo', () => {
    render(<EstadoViajeChip estado="COMPLETADO" />);

    const chip = screen.getByText('Completado');
    expect(chip.className).toContain('bg-info-container');
    expect(chip.className).toContain('text-on-info-container');
  });

  it('CANCELADO se presenta en tono de error', () => {
    render(<EstadoViajeChip estado="CANCELADO" />);

    const chip = screen.getByText('Cancelado');
    expect(chip.className).toContain('bg-error-container');
    expect(chip.className).toContain('text-on-error-container');
  });

  it('un estado desconocido se muestra tal cual, en tono neutro', () => {
    render(<EstadoViajeChip estado="EN_ADUANA_PENDIENTE" />);

    // Sin mapeo no hay traduccion amable: se pinta el codigo, que avisa de que falta
    // mapearlo. Inventar una etiqueta seria afirmar algo que el contrato no dice.
    const chip = screen.getByText('EN_ADUANA_PENDIENTE');
    expect(chip.className).toContain('bg-surface-container-high');
  });

  it('el punto de color es decorativo y no se anuncia', () => {
    render(<EstadoViajeChip estado="EN_RUTA" />);

    // El color no puede ser el unico portador de significado: la etiqueta ya lo dice.
    const punto = screen.getByText('En Ruta').querySelector('span[aria-hidden="true"]');
    expect(punto).not.toBeNull();
  });
});
