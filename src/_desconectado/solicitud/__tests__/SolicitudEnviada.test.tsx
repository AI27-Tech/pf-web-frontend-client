/*
 * Pantalla de confirmación — "Solicitud enviada".
 *
 * Verifica que muestra el ID simulado y el resumen (ruta/fecha/hora) del borrador
 * enviado, que "Volver al inicio" dispara el reinicio, y que "Ver solicitud" esta
 * presente aunque sea inerte (sin handler).
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { BorradorSolicitud } from '../tipos';
import { SolicitudEnviada } from '../SolicitudEnviada';

const BORRADOR: BorradorSolicitud = {
  servicio: {
    tipoServicio: 'monitoreo-activo',
    fechaSalida: '2023-11-24',
    horaSalida: '08:00',
    prioridad: 'alta',
    referenciaOrden: '',
    contactoNombre: '',
    contactoTelefono: '',
  },
  origen: {
    nombreLugar: 'CDMX Vallejo',
    calleNumero: '',
    ciudadEstado: '',
    codigoPostal: '',
    contactoSitio: '',
    telefonoContacto: '',
    instruccionesAcceso: '',
  },
  destino: {
    nombreLugar: 'Laredo, US',
    calleNumero: '',
    ciudadEstado: '',
    codigoPostal: '',
    contactoSitio: '',
    telefonoContacto: '',
    instruccionesAcceso: '',
  },
  carga: {
    categoria: '',
    valorEstimado: '',
    requisitos: [],
    requerimientosVehiculo: '',
    instruccionesOperativas: '',
  },
  documentacion: { comentarios: '' },
};

describe('SolicitudEnviada', () => {
  it('muestra el ID simulado y el resumen del borrador', () => {
    render(
      <SolicitudEnviada id="AI27-231124-042" borrador={BORRADOR} onVolverAlInicio={() => {}} />,
    );

    expect(screen.getByText('AI27-231124-042')).toBeInTheDocument();
    expect(screen.getByText(/CDMX Vallejo/)).toBeInTheDocument();
    expect(screen.getByText(/Laredo, US/)).toBeInTheDocument();
    expect(screen.getByText('08:00')).toBeInTheDocument();
  });

  it('"Volver al inicio" dispara el reinicio', () => {
    const onVolver = vi.fn();
    render(
      <SolicitudEnviada id="AI27-231124-042" borrador={BORRADOR} onVolverAlInicio={onVolver} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Volver al inicio' }));
    expect(onVolver).toHaveBeenCalledTimes(1);
  });

  it('"Ver solicitud" está presente (inerte)', () => {
    render(
      <SolicitudEnviada id="AI27-231124-042" borrador={BORRADOR} onVolverAlInicio={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Ver solicitud' })).toBeInTheDocument();
  });
});
