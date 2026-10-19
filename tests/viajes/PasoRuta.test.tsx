/*
 * Paso 2 — Ruta.
 *
 * Verifica que Origen y Destino despachan a secciones independientes del borrador y
 * que el "Resumen de Ruta" refleja el nombre del lugar (o "Por definir" si esta vacio).
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { DatosUbicacion } from '@/lib/contracts';
import { PasoRuta } from '@/features/viajes/solicitud/PasoRuta';

const UBICACION_VACIA: DatosUbicacion = {
  nombreLugar: '',
  calleNumero: '',
  ciudadEstado: '',
  codigoPostal: '',
  contactoSitio: '',
  telefonoContacto: '',
  instruccionesAcceso: '',
};

describe('PasoRuta', () => {
  it('edita Origen despachando a la seccion origen', () => {
    const dispatch = vi.fn();
    render(<PasoRuta origen={UBICACION_VACIA} destino={UBICACION_VACIA} dispatch={dispatch} />);

    const origen = screen.getByRole('region', { name: 'Origen' });
    fireEvent.change(within(origen).getByLabelText('Nombre del lugar o empresa *'), {
      target: { value: 'CEDIS Norte' },
    });

    expect(dispatch).toHaveBeenCalledWith({
      tipo: 'origen',
      campo: 'nombreLugar',
      valor: 'CEDIS Norte',
    });
  });

  it('edita Destino despachando a la seccion destino', () => {
    const dispatch = vi.fn();
    render(<PasoRuta origen={UBICACION_VACIA} destino={UBICACION_VACIA} dispatch={dispatch} />);

    const destino = screen.getByRole('region', { name: 'Destino' });
    fireEvent.change(within(destino).getByLabelText('Ciudad y Estado *'), {
      target: { value: 'Guadalajara, Jal.' },
    });

    expect(dispatch).toHaveBeenCalledWith({
      tipo: 'destino',
      campo: 'ciudadEstado',
      valor: 'Guadalajara, Jal.',
    });
  });

  it('el resumen usa "Por definir" cuando no hay datos y no inventa distancia', () => {
    const dispatch = vi.fn();
    render(<PasoRuta origen={UBICACION_VACIA} destino={UBICACION_VACIA} dispatch={dispatch} />);

    const resumen = screen.getByRole('region', { name: 'Resumen de Ruta' });
    expect(within(resumen).getAllByText('Por definir')).toHaveLength(2);
    expect(within(resumen).getByText('-- km')).toBeInTheDocument();
  });

  it('el resumen refleja el nombre del lugar cuando existe', () => {
    const dispatch = vi.fn();
    render(
      <PasoRuta
        origen={{ ...UBICACION_VACIA, nombreLugar: 'CEDIS Norte' }}
        destino={UBICACION_VACIA}
        dispatch={dispatch}
      />,
    );

    const resumen = screen.getByRole('region', { name: 'Resumen de Ruta' });
    expect(within(resumen).getByText('CEDIS Norte')).toBeInTheDocument();
  });
});
