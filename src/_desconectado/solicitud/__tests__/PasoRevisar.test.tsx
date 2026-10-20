/*
 * Paso 4 — Revisar.
 *
 * Verifica que se resuelven las etiquetas de catalogo (no se muestran los `id`), que
 * "Editar" navega al paso correcto de cada seccion, que "Enviar solicitud" esta
 * bloqueado hasta marcar la confirmacion, y que los chips derivados (prioridad alta,
 * alto valor) aparecen.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { BorradorSolicitud } from '../tipos';
import { PasoRevisar } from '../PasoRevisar';
import type { CatalogosSolicitud } from '../pasos';

const CATALOGOS: CatalogosSolicitud = {
  tiposServicio: [{ id: 'monitoreo-activo', nombre: 'Monitoreo Activo' }],
  prioridades: [
    { id: 'estandar', nombre: 'Estándar' },
    { id: 'alta', nombre: 'Alta' },
  ],
  categorias: [{ id: 'electronicos', nombre: 'Electrónicos' }],
  rangosValor: [{ id: '2m-10m', nombre: '$2,000,000 – $10,000,000' }],
  requisitos: [{ id: 'alto-valor', nombre: 'Alto Valor' }],
};

const BORRADOR: BorradorSolicitud = {
  servicio: {
    tipoServicio: 'monitoreo-activo',
    fechaSalida: '2023-11-24',
    horaSalida: '08:00',
    prioridad: 'alta',
    referenciaOrden: '',
    contactoNombre: 'Ana G.',
    contactoTelefono: '5555',
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
    categoria: 'electronicos',
    valorEstimado: '2m-10m',
    requisitos: ['alto-valor'],
    requerimientosVehiculo: 'Caja seca 53 pies',
    instruccionesOperativas: 'No realizar paradas en zonas no autorizadas.',
  },
  documentacion: { comentarios: '' },
};

function renderRevisar() {
  const onEditar = vi.fn();
  const onRegresar = vi.fn();
  const onEnviar = vi.fn();
  render(
    <PasoRevisar
      borrador={BORRADOR}
      catalogos={CATALOGOS}
      onEditar={onEditar}
      onRegresar={onRegresar}
      onEnviar={onEnviar}
    />,
  );
  return { onEditar, onEnviar };
}

describe('PasoRevisar', () => {
  it('muestra etiquetas de catalogo, no los ids', () => {
    renderRevisar();
    expect(screen.getByText('Monitoreo Activo')).toBeInTheDocument();
    expect(screen.getByText('Electrónicos')).toBeInTheDocument();
    // La prioridad alta se pinta como chip con su etiqueta.
    expect(screen.getByText('Alta')).toBeInTheDocument();
    // "Alto Valor" aparece al menos como chip de valor declarado (y como condicion).
    expect(screen.getAllByText('Alto Valor').length).toBeGreaterThanOrEqual(1);
  });

  it('Editar en cada tarjeta navega a su paso', () => {
    const { onEditar } = renderRevisar();

    const servicio = screen.getByRole('region', { name: 'Servicio y Fecha' });
    fireEvent.click(within(servicio).getByRole('button', { name: /Editar/ }));
    expect(onEditar).toHaveBeenCalledWith('servicio');

    const ruta = screen.getByRole('region', { name: 'Ruta' });
    fireEvent.click(within(ruta).getByRole('button', { name: /Editar/ }));
    expect(onEditar).toHaveBeenCalledWith('ruta');

    const carga = screen.getByRole('region', { name: 'Detalles de Carga y Operación' });
    fireEvent.click(within(carga).getByRole('button', { name: /Editar/ }));
    expect(onEditar).toHaveBeenCalledWith('detalles');
  });

  it('Enviar solicitud esta bloqueado hasta confirmar', () => {
    const { onEnviar } = renderRevisar();

    const enviar = screen.getByRole('button', { name: /Enviar solicitud/ });
    expect(enviar).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/Confirmo que la información/));
    expect(enviar).toBeEnabled();

    fireEvent.click(enviar);
    expect(onEnviar).toHaveBeenCalledTimes(1);
  });
});
