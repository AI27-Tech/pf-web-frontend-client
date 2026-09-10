/*
 * Las tarjetas de indicador y el bloque de acciones.
 *
 * Lo que se prueba no es el aspecto: es que la etiqueta del indicador llegue como
 * texto (y no solo como color o icono), que el icono NO se anuncie dos veces, y que
 * "Solicitar Servicio" sea una navegacion real a la ruta de solicitud.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Truck } from 'lucide-react';
import { KpiCard } from '@/features/panel/KpiCard';
import { QuickActionsCard } from '@/features/panel/QuickActionsCard';
import { renderConRouter } from '../support/router';

describe('KpiCard', () => {
  it('presenta etiqueta, valor y pie como texto legible', () => {
    render(<KpiCard etiqueta="Viajes activos" valor={24} pie="+3 desde ayer" tono="success" />);

    expect(screen.getByText('Viajes activos')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('+3 desde ayer')).toBeInTheDocument();
  });

  it('el icono es decorativo y no se anuncia', () => {
    render(
      <KpiCard
        etiqueta="Viajes activos"
        valor={24}
        icono={<Truck aria-hidden="true" className="size-5" data-testid="icono" />}
      />,
    );

    // El nombre del indicador ya lo da la etiqueta: el icono no debe repetirlo.
    expect(screen.getByTestId('icono')).toHaveAttribute('aria-hidden', 'true');
  });

  it('acepta un valor de varias lineas sin convertirlo en texto plano', () => {
    // "Bajo / Normal" se pinta en dos lineas en el diseno: el valor es un nodo, no un
    // string, y la tarjeta no interpreta lo que recibe.
    render(
      <KpiCard
        etiqueta="Nivel de riesgo global"
        valor={
          <>
            Bajo /<br />
            Normal
          </>
        }
        tono="primary"
      />,
    );

    expect(screen.getByText(/Bajo/)).toBeInTheDocument();
    expect(screen.getByText(/Normal/)).toBeInTheDocument();
  });
});

describe('QuickActionsCard', () => {
  it('"Solicitar Servicio" es un enlace a la ruta de solicitud', async () => {
    renderConRouter(<QuickActionsCard />);

    const enlace = await screen.findByRole('link', { name: /Solicitar Servicio/i });
    // Enlace de verdad: abrible en pestana nueva, con destino visible. No un boton.
    expect(enlace).toHaveAttribute('href', '/viajes/new');
  });

  it('"Descargar Reporte" existe y sigue operable aunque no haga nada todavia', async () => {
    renderConRouter(<QuickActionsCard />);

    const boton = await screen.findByRole('button', { name: /Descargar Reporte/i });
    /*
     * A proposito NO deshabilitado: "disabled" comunica "no puedes ahora", y lo
     * cierto es "esto todavia no se ha construido". Deshabilitarlo mentiria sobre el
     * motivo y lo sacaria del orden de tabulacion sin razon.
     */
    expect(boton).toBeEnabled();
  });
});
