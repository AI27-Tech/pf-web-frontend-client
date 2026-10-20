/*
 * El chip de estado, probado por su mapeo estado -> señal táctica del `Badge`.
 *
 * Los estados son los del contrato generado (`@ai27-tech/contracts/estados`, ADR 19):
 * unión cerrada. Ya no hay caso de "estado desconocido" porque el compilador lo impide
 * — un valor fuera del enum no compila. Las condiciones superpuestas se retiraron del
 * chip con el recorte al contrato (viajan en el detalle, no en el resumen).
 *
 * El chip se compone sobre el `Badge` de `@ai27-tech/ui`; la apariencia la aporta la
 * libreria por su variante (clases de CSS-module `_secure_`, `_escort_`, `_alert_`,
 * `_neutral_`). Aqui se comprueba el mapeo estado -> variante, no el color literal.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EstadoViaje } from '@/lib/contracts';
import { EstadoViajeChip } from '@/features/viajes/EstadoViajeChip';

/** El nodo del badge de la libreria es el ancestro con la clase `_badge_`. */
function badgeDe(texto: string): HTMLElement {
  const chip = screen.getByText(texto).closest('span[class*="_badge_"]');
  expect(chip).not.toBeNull();
  return chip as HTMLElement;
}

describe('EstadoViajeChip', () => {
  it('EN_TRANSITO se presenta con la senal "secure"', () => {
    render(<EstadoViajeChip estado={EstadoViaje.EnTransito} />);

    expect(screen.getByText('En tránsito')).toBeInTheDocument();
    expect(badgeDe('En tránsito').className).toContain('secure');
  });

  it('SOLICITADO se presenta con la senal "escort"', () => {
    render(<EstadoViajeChip estado={EstadoViaje.Solicitado} />);

    expect(badgeDe('Solicitado').className).toContain('escort');
  });

  it('CERRADO se presenta con la senal "escort"', () => {
    render(<EstadoViajeChip estado={EstadoViaje.Cerrado} />);

    expect(badgeDe('Cerrado').className).toContain('escort');
  });

  it('CANCELADO se presenta con la senal "alert"', () => {
    render(<EstadoViajeChip estado={EstadoViaje.Cancelado} />);

    expect(badgeDe('Cancelado').className).toContain('alert');
  });

  it('el punto de color es decorativo y no se anuncia', () => {
    render(<EstadoViajeChip estado={EstadoViaje.EnTransito} />);

    // El color no puede ser el unico portador de significado: la etiqueta ya lo dice.
    const punto = badgeDe('En tránsito').querySelector('span[aria-hidden="true"]');
    expect(punto).not.toBeNull();
  });
});
