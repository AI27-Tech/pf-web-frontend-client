/*
 * Paso 3 — Detalles.
 *
 * Verifica que categoria/valor despachan a la seccion carga, que las casillas de
 * requisitos despachan el toggle `carga-requisito` (marcar y desmarcar), que la casilla
 * ya marcada aparece activa, y que la zona de carga de documentos es un placeholder.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { DatosCarga, OpcionCatalogo } from '@/lib/contracts';
import { PasoDetalles } from '@/features/viajes/solicitud/PasoDetalles';

const CATEGORIAS: readonly OpcionCatalogo[] = [{ id: 'electronicos', nombre: 'Electrónicos' }];
const RANGOS: readonly OpcionCatalogo[] = [{ id: '2m-10m', nombre: '$2,000,000 – $10,000,000' }];
const REQUISITOS: readonly OpcionCatalogo[] = [
  { id: 'fragil', nombre: 'Frágil' },
  { id: 'alto-valor', nombre: 'Alto Valor' },
];

const CARGA_VACIA: DatosCarga = {
  categoria: '',
  valorEstimado: '',
  requisitos: [],
  requerimientosVehiculo: '',
  instruccionesOperativas: '',
};

function renderPaso(carga: DatosCarga = CARGA_VACIA) {
  const dispatch = vi.fn();
  render(
    <PasoDetalles
      carga={carga}
      documentacionComentarios=""
      categorias={CATEGORIAS}
      rangosValor={RANGOS}
      requisitos={REQUISITOS}
      dispatch={dispatch}
    />,
  );
  return dispatch;
}

describe('PasoDetalles', () => {
  it('elegir categoria despacha a la seccion carga', () => {
    const dispatch = renderPaso();
    fireEvent.change(screen.getByLabelText('Categoría de la carga'), {
      target: { value: 'electronicos' },
    });
    expect(dispatch).toHaveBeenCalledWith({
      tipo: 'carga',
      campo: 'categoria',
      valor: 'electronicos',
    });
  });

  it('marcar un requisito despacha el toggle activo', () => {
    const dispatch = renderPaso();
    fireEvent.click(screen.getByLabelText('Frágil'));
    expect(dispatch).toHaveBeenCalledWith({
      tipo: 'carga-requisito',
      codigo: 'fragil',
      activo: true,
    });
  });

  it('desmarcar un requisito ya activo despacha activo=false', () => {
    const dispatch = renderPaso({ ...CARGA_VACIA, requisitos: ['fragil'] });

    const casilla = screen.getByLabelText('Frágil');
    expect(casilla).toBeChecked();

    fireEvent.click(casilla);
    expect(dispatch).toHaveBeenCalledWith({
      tipo: 'carga-requisito',
      codigo: 'fragil',
      activo: false,
    });
  });

  it('la zona de carga de documentos es un placeholder inerte', () => {
    renderPaso();
    expect(screen.getByRole('button', { name: /no disponible/i })).toBeDisabled();
  });
});
