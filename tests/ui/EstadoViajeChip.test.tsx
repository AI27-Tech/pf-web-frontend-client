/*
 * El chip de estado, probado por lo que NO debe hacer: inventar estados.
 *
 * `lib/contracts/estados.ts` solo confirma SOLICITADO. El chip tiene que dar las
 * senales tacticas que el diseno pide sin declarar codigos que el contrato no tiene, y
 * tiene que mostrar un codigo desconocido en lugar de disfrazarlo. El ultimo test es el
 * que protege esa propiedad.
 *
 * El chip se compone sobre el `Badge` de `@ai27-tech/ui`; la apariencia la aporta la
 * libreria por su variante (clases de CSS-module `_secure_`, `_escort_`, `_warning_`,
 * `_alert_`, `_neutral_`). Aqui se comprueba el mapeo estado -> variante y la
 * superposicion de condiciones, no el color literal.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EstadoViajeChip } from '@/features/viajes/EstadoViajeChip';

const condicionRetrasado = {
  codigo: 'RETRASADO',
  descripcion: 'Retrasado',
  desde: '2026-09-09T10:20:00Z',
} as const;

/** El nodo del badge de la libreria es el ancestro con la clase `_badge_`. */
function badgeDe(texto: string): HTMLElement {
  const chip = screen.getByText(texto).closest('span[class*="_badge_"]');
  expect(chip).not.toBeNull();
  return chip as HTMLElement;
}

describe('EstadoViajeChip', () => {
  it('EN_RUTA sin condiciones se presenta con la senal "secure"', () => {
    render(<EstadoViajeChip estado="EN_RUTA" />);

    expect(screen.getByText('En Ruta')).toBeInTheDocument();
    expect(badgeDe('En Ruta').className).toContain('secure');
  });

  it('SOLICITADO se presenta con la senal "escort"', () => {
    render(<EstadoViajeChip estado="SOLICITADO" />);

    expect(badgeDe('Solicitado').className).toContain('escort');
  });

  it('una condicion activa gana al estado y se convierte en la etiqueta', () => {
    render(<EstadoViajeChip estado="EN_RUTA" condicionesActivas={[condicionRetrasado]} />);

    /*
     * La condicion se superpone al estado de progreso (§C.2): en una fila de una
     * linea, la anomalia es lo que el operador necesita ver, no que sigue "en ruta".
     */
    expect(badgeDe('Retrasado').className).toContain('warning');
    expect(screen.queryByText('En Ruta')).not.toBeInTheDocument();
  });

  it('COMPLETADO se presenta con la senal "escort"', () => {
    render(<EstadoViajeChip estado="COMPLETADO" />);

    expect(badgeDe('Completado').className).toContain('escort');
  });

  it('CANCELADO se presenta con la senal "alert"', () => {
    render(<EstadoViajeChip estado="CANCELADO" />);

    expect(badgeDe('Cancelado').className).toContain('alert');
  });

  it('un estado desconocido se muestra tal cual, en senal neutra', () => {
    render(<EstadoViajeChip estado="EN_ADUANA_PENDIENTE" />);

    // Sin mapeo no hay traduccion amable: se pinta el codigo, que avisa de que falta
    // mapearlo. Inventar una etiqueta seria afirmar algo que el contrato no dice.
    expect(badgeDe('EN_ADUANA_PENDIENTE').className).toContain('neutral');
  });

  it('el punto de color es decorativo y no se anuncia', () => {
    render(<EstadoViajeChip estado="EN_RUTA" />);

    // El color no puede ser el unico portador de significado: la etiqueta ya lo dice.
    const punto = badgeDe('En Ruta').querySelector('span[aria-hidden="true"]');
    expect(punto).not.toBeNull();
  });
});
