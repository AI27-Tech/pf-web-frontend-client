/*
 * Paso 1 — Servicio y Fecha.
 *
 * Verifica que las tarjetas de tipo de servicio salen del catalogo, que la seleccion
 * y los campos despachan la accion correcta contra la seccion `servicio`, y que un
 * valor del catalogo desconocido no rompe (se pinta con presentacion neutra).
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { DatosServicio, OpcionCatalogo } from '@/lib/contracts';
import { PasoServicioFecha } from '@/features/viajes/solicitud/PasoServicioFecha';

const TIPOS: readonly OpcionCatalogo[] = [
  { id: 'monitoreo-activo', nombre: 'Monitoreo Activo' },
  { id: 'custodia-armada', nombre: 'Custodia Armada' },
  { id: 'localizacion-gps', nombre: 'Localización GPS' },
];

const PRIORIDADES: readonly OpcionCatalogo[] = [
  { id: 'estandar', nombre: 'Estándar' },
  { id: 'alta', nombre: 'Alta' },
];

const DATOS_VACIOS: DatosServicio = {
  tipoServicio: '',
  fechaSalida: '',
  horaSalida: '',
  prioridad: '',
  referenciaOrden: '',
  contactoNombre: '',
  contactoTelefono: '',
};

function renderPaso(datos: DatosServicio = DATOS_VACIOS) {
  const dispatch = vi.fn();
  render(
    <PasoServicioFecha
      datos={datos}
      tiposServicio={TIPOS}
      prioridades={PRIORIDADES}
      dispatch={dispatch}
    />,
  );
  return dispatch;
}

describe('PasoServicioFecha', () => {
  it('pinta las tres tarjetas de tipo de servicio desde el catalogo', () => {
    renderPaso();
    expect(screen.getByRole('radio', { name: /Monitoreo Activo/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Custodia Armada/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Localización GPS/ })).toBeInTheDocument();
  });

  it('seleccionar un tipo despacha la accion de servicio', () => {
    const dispatch = renderPaso();
    fireEvent.click(screen.getByRole('radio', { name: /Custodia Armada/ }));
    expect(dispatch).toHaveBeenCalledWith({
      tipo: 'servicio',
      campo: 'tipoServicio',
      valor: 'custodia-armada',
    });
  });

  it('editar el contacto despacha contra la seccion servicio', () => {
    const dispatch = renderPaso();
    fireEvent.change(screen.getByLabelText('Nombre del contacto en sitio *'), {
      target: { value: 'Ana G.' },
    });
    expect(dispatch).toHaveBeenCalledWith({
      tipo: 'servicio',
      campo: 'contactoNombre',
      valor: 'Ana G.',
    });
  });

  it('elegir prioridad despacha el id del catalogo', () => {
    const dispatch = renderPaso();
    fireEvent.change(screen.getByLabelText('Prioridad del servicio'), {
      target: { value: 'alta' },
    });
    expect(dispatch).toHaveBeenCalledWith({ tipo: 'servicio', campo: 'prioridad', valor: 'alta' });
  });

  it('un tipo de servicio desconocido se pinta igual, sin romper', () => {
    const dispatch = vi.fn();
    render(
      <PasoServicioFecha
        datos={DATOS_VACIOS}
        tiposServicio={[{ id: 'tipo-nuevo', nombre: 'Tipo Nuevo' }]}
        prioridades={PRIORIDADES}
        dispatch={dispatch}
      />,
    );
    expect(screen.getByRole('radio', { name: /Tipo Nuevo/ })).toBeInTheDocument();
  });
});
