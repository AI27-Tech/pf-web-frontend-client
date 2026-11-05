/*
 * CancelarRechazarPanel — cancelar / rechazar el viaje, carril cliente (E1-HU-002 /
 * E9-T7, AI27-26).
 *
 * Estados obligatorios del ticket cubiertos aquí:
 *   - ventana de cancelación ABIERTA: el botón se ofrece en los estados esperados;
 *   - ventana CERRADA: en EN_EMBARQUE/EN_TRANSITO la acción NO se ofrece y se explica
 *     por qué (no un fallo al pulsar);
 *   - viaje ya TERMINAL: tampoco se ofrece, con su propia explicación;
 *   - rechazar solo donde aplica (ASIGNADO/APTO_PARA_SALIDA), no en SOLICITADO;
 *   - el botón de confirmar EXIGE motivo (deshabilitado mientras esté vacío);
 *   - los dos desenlaces (CANCELADO vs RECHAZADO_POR_CLIENTE) son distinguibles;
 *   - en éxito, el 200 refresca la caché `['viaje', id]` SIN un segundo GET;
 *   - carrera con una transición de operación: el 409 muestra un mensaje claro.
 *
 * El carril de API (`@/lib/api/viajes`) se sustituye por dobles: estas pruebas fijan el
 * COMPORTAMIENTO de la UI (qué ofrece, qué manda, cómo refresca), no la pila HTTP.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ViajeSeguimiento } from '@/lib/contracts';
import { ApiError } from '@/lib/api/errors';

const transicionarViajeCliente = vi.fn();
const getViaje = vi.fn();
vi.mock('@/lib/api/viajes', async () => {
  const real = await vi.importActual<typeof import('@/lib/api/viajes')>('@/lib/api/viajes');
  return {
    ...real,
    transicionarViajeCliente: (...args: unknown[]) => transicionarViajeCliente(...args),
    getViaje: (...args: unknown[]) => getViaje(...args),
  };
});

const { CancelarRechazarPanel } = await import('@/features/viajes/CancelarRechazarPanel');
const { renderConQuery } = await import('../support/query');
const { viajeQueryKey } = await import('@/features/viajes/useViajeSeguimiento');

function seguimiento(estado: string): ViajeSeguimiento {
  return { id: 'viaje-1', hito: { estado, etiqueta: estado }, eta: null, incidencias: [] };
}

beforeEach(() => {
  transicionarViajeCliente.mockReset();
  getViaje.mockReset();
});

afterEach(() => vi.restoreAllMocks());

describe('CancelarRechazarPanel — ventana de disponibilidad (E9-T7)', () => {
  it.each(['SOLICITADO', 'APROBADO', 'ASIGNADO', 'APTO_PARA_SALIDA'])(
    'en %s ofrece CANCELAR',
    (estado) => {
      renderConQuery(<CancelarRechazarPanel viaje={seguimiento(estado)} />);
      expect(screen.getByRole('button', { name: 'Cancelar viaje' })).toBeInTheDocument();
    },
  );

  it.each(['ASIGNADO', 'APTO_PARA_SALIDA'])('en %s ofrece RECHAZAR', (estado) => {
    renderConQuery(<CancelarRechazarPanel viaje={seguimiento(estado)} />);
    expect(screen.getByRole('button', { name: 'Rechazar servicio' })).toBeInTheDocument();
  });

  it('en SOLICITADO ofrece cancelar pero NO rechazar (rechazar es solo del asignado)', () => {
    renderConQuery(<CancelarRechazarPanel viaje={seguimiento('SOLICITADO')} />);
    expect(screen.getByRole('button', { name: 'Cancelar viaje' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rechazar servicio' })).not.toBeInTheDocument();
  });

  it.each(['EN_EMBARQUE', 'EN_TRANSITO'])(
    'ventana CERRADA en %s: no ofrece botones y explica que el viaje ya salió',
    (estado) => {
      renderConQuery(<CancelarRechazarPanel viaje={seguimiento(estado)} />);
      expect(screen.queryByRole('button', { name: 'Cancelar viaje' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Rechazar servicio' })).not.toBeInTheDocument();
      // Se explica por qué ya no aplica, no se deja fallar al pulsar.
      expect(screen.getByText(/ya salió/i)).toBeInTheDocument();
    },
  );

  it.each(['CERRADO', 'CANCELADO', 'RECHAZADO_POR_CLIENTE', 'RECHAZADO_POR_AI27'])(
    'viaje TERMINAL en %s: no ofrece botones y explica que ya finalizó',
    (estado) => {
      renderConQuery(<CancelarRechazarPanel viaje={seguimiento(estado)} />);
      expect(screen.queryByRole('button', { name: 'Cancelar viaje' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Rechazar servicio' })).not.toBeInTheDocument();
      expect(screen.getByText(/ya finalizó/i)).toBeInTheDocument();
    },
  );
});

describe('CancelarRechazarPanel — el motivo es obligatorio (E9-T7, DEC-111)', () => {
  it('el botón de confirmar está deshabilitado mientras el motivo esté vacío', async () => {
    const user = userEvent.setup();
    renderConQuery(<CancelarRechazarPanel viaje={seguimiento('SOLICITADO')} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar viaje' }));

    // El botón de confirmar del diálogo («Confirmar cancelación») empieza inerte: falta
    // el motivo. Su etiqueta es distinta del disparador, así que no hay ambigüedad.
    const confirmar = screen.getByRole('button', { name: 'Confirmar cancelación' });
    expect(confirmar).toBeDisabled();

    // Solo espacios: sigue deshabilitado (el recorte lo deja vacío).
    await user.type(screen.getByLabelText('Motivo de la cancelación'), '   ');
    expect(confirmar).toBeDisabled();
    expect(transicionarViajeCliente).not.toHaveBeenCalled();

    // Con texto real: se habilita.
    await user.type(screen.getByLabelText('Motivo de la cancelación'), 'ya no lo necesito');
    await waitFor(() => expect(confirmar).toBeEnabled());
  });
});

describe('CancelarRechazarPanel — dos desenlaces distintos (E9-T7)', () => {
  it('cancelar manda CANCELADO; rechazar manda RECHAZADO_POR_CLIENTE', async () => {
    transicionarViajeCliente.mockImplementation((_id, aEstado) =>
      Promise.resolve(seguimiento(aEstado)),
    );
    const user = userEvent.setup();
    // En APTO_PARA_SALIDA caben las DOS acciones.
    renderConQuery(<CancelarRechazarPanel viaje={seguimiento('APTO_PARA_SALIDA')} />);

    // Rechazar.
    await user.click(screen.getByRole('button', { name: 'Rechazar servicio' }));
    await user.type(screen.getByLabelText('Motivo del rechazo'), 'no acepto la unidad');
    await user.click(screen.getByRole('button', { name: 'Confirmar rechazo' }));

    await waitFor(() => expect(transicionarViajeCliente).toHaveBeenCalledTimes(1));
    expect(transicionarViajeCliente).toHaveBeenLastCalledWith(
      'viaje-1',
      'RECHAZADO_POR_CLIENTE',
      'no acepto la unidad',
    );
  });

  it('cancelar manda CANCELADO con su propio motivo', async () => {
    transicionarViajeCliente.mockImplementation((_id, aEstado) =>
      Promise.resolve(seguimiento(aEstado)),
    );
    const user = userEvent.setup();
    renderConQuery(<CancelarRechazarPanel viaje={seguimiento('SOLICITADO')} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar viaje' }));
    await user.type(screen.getByLabelText('Motivo de la cancelación'), 'cambio de planes');
    await user.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));

    await waitFor(() => expect(transicionarViajeCliente).toHaveBeenCalledTimes(1));
    expect(transicionarViajeCliente).toHaveBeenLastCalledWith(
      'viaje-1',
      'CANCELADO',
      'cambio de planes',
    );
  });
});

describe('CancelarRechazarPanel — el 200 refresca la caché sin segundo GET (E9-T7)', () => {
  it('siembra ViajeSeguimiento devuelto en [viaje, id] y no llama a getViaje', async () => {
    const devuelto = seguimiento('CANCELADO');
    transicionarViajeCliente.mockResolvedValue(devuelto);
    const user = userEvent.setup();
    const { client } = renderConQuery(<CancelarRechazarPanel viaje={seguimiento('SOLICITADO')} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar viaje' }));
    await user.type(screen.getByLabelText('Motivo de la cancelación'), 'ya no');
    await user.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));

    await waitFor(() => expect(transicionarViajeCliente).toHaveBeenCalledTimes(1));
    // La caché del seguimiento quedó con la respuesta del 200, tal cual.
    await waitFor(() => expect(client.getQueryData(viajeQueryKey('viaje-1'))).toEqual(devuelto));
    // Y no hubo un segundo GET del viaje.
    expect(getViaje).not.toHaveBeenCalled();
  });
});

describe('CancelarRechazarPanel — carrera con operación (409) (E9-T7)', () => {
  it('un 409 muestra un mensaje claro de que el viaje cambió de estado', async () => {
    transicionarViajeCliente.mockRejectedValue(
      new ApiError('conflicto', 'POST respondió 409', 409, 'transicion_no_permitida'),
    );
    const user = userEvent.setup();
    renderConQuery(<CancelarRechazarPanel viaje={seguimiento('APTO_PARA_SALIDA')} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar viaje' }));
    await user.type(screen.getByLabelText('Motivo de la cancelación'), 'cambio de planes');
    await user.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/cambió de estado/i);
  });
});
