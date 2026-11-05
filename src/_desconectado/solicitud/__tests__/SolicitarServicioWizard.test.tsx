/*
 * El andamiaje del asistente: stepper y navegacion del wizard.
 *
 * El wizard recibe `paso` y `navegarAPaso` por props (la ruta es quien lee el search),
 * asi que se prueba sin router: se verifica que Continuar/Regresar/Enviar despachan la
 * navegacion correcta y que una entrada en frio a un paso avanzado rebota al primero.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StepperSolicitud } from '@/_desconectado/solicitud/StepperSolicitud';
import { SolicitarServicioWizard } from '@/_desconectado/solicitud/SolicitarServicioWizard';
import type { CatalogosSolicitud } from '@/_desconectado/solicitud/pasos';

const CATALOGOS_VACIOS: CatalogosSolicitud = {
  tiposServicio: [],
  prioridades: [],
  categorias: [],
  rangosValor: [],
  requisitos: [],
};

describe('StepperSolicitud', () => {
  it('marca el paso activo con aria-current y muestra las cuatro etiquetas', () => {
    render(<StepperSolicitud pasoActual="ruta" />);

    expect(screen.getByText('Servicio y Fecha')).toBeInTheDocument();
    expect(screen.getByText('Ruta')).toBeInTheDocument();
    expect(screen.getByText('Detalles')).toBeInTheDocument();
    expect(screen.getByText('Revisar')).toBeInTheDocument();

    const activo = screen.getByText('Ruta');
    expect(activo).toHaveAttribute('aria-current', 'step');
  });
});

describe('SolicitarServicioWizard · navegacion', () => {
  it('en el primer paso no muestra Regresar y Continuar avanza a "ruta"', () => {
    const navegar = vi.fn();
    render(
      <SolicitarServicioWizard
        paso="servicio"
        navegarAPaso={navegar}
        catalogos={CATALOGOS_VACIOS}
      />,
    );

    expect(screen.queryByRole('button', { name: /Regresar/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(navegar).toHaveBeenCalledWith('ruta');
  });

  it('Regresar retrocede al paso anterior', () => {
    const navegar = vi.fn();
    render(
      <SolicitarServicioWizard
        paso="detalles"
        navegarAPaso={navegar}
        catalogos={CATALOGOS_VACIOS}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Regresar/ }));
    expect(navegar).toHaveBeenCalledWith('ruta');
  });

  it('en "revisar" Enviar solicitud (tras confirmar) lleva a la confirmacion', () => {
    const navegar = vi.fn();
    render(
      <SolicitarServicioWizard
        paso="revisar"
        navegarAPaso={navegar}
        catalogos={CATALOGOS_VACIOS}
      />,
    );

    // El envio esta bloqueado hasta marcar la casilla de confirmacion.
    fireEvent.click(screen.getByLabelText(/Confirmo que la información/));
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/ }));
    expect(navegar).toHaveBeenCalledWith('enviada');
  });

  it('entrar en frio a un paso avanzado con el borrador vacio rebota a "servicio"', () => {
    const navegar = vi.fn();
    render(
      <SolicitarServicioWizard
        paso="revisar"
        navegarAPaso={navegar}
        catalogos={CATALOGOS_VACIOS}
      />,
    );

    expect(navegar).toHaveBeenCalledWith('servicio');
  });
});
