/*
 * ConversacionSection — conversación del cliente (E9-T8 / E3-HU-014, AI27-27).
 *
 * Estados obligatorios del ticket cubiertos aquí:
 *   - con historial: ordenado por secuencia, etiqueta "AI27 Operations" para AI27
 *   - atendida/resuelta: el indicador es visible
 *   - solo lectura / cerrada: el envío está deshabilitado con la razón
 *   - 409 conversacion_solo_lectura: deshabilita/explica el envío
 *   - la vista NO renderiza datos internos (actor real, rol, bandeja, reclamo)
 *
 * El carril de API (`@/lib/api/conversacion`) se sustituye por dobles: estas pruebas
 * fijan el COMPORTAMIENTO de la UI (qué muestra, qué deshabilita), no la pila HTTP.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/lib/api/errors';
import { toDomainSeq } from '@/lib/contracts';
import type { ConversacionCliente } from '@/lib/contracts';
import type { MensajeVista, PaginaMensajesVista } from '@/lib/api/conversacion';

const obtenerConversacionViaje = vi.fn();
const listarMensajesViaje = vi.fn();
const enviarMensajeViaje = vi.fn();
vi.mock('@/lib/api/conversacion', () => ({
  obtenerConversacionViaje: (...args: unknown[]) => obtenerConversacionViaje(...args),
  listarMensajesViaje: (...args: unknown[]) => listarMensajesViaje(...args),
  enviarMensajeViaje: (...args: unknown[]) => enviarMensajeViaje(...args),
}));

const { ConversacionSection } = await import('@/features/conversacion/ConversacionSection');
const { renderConQuery } = await import('../support/query');

function mensaje(partial: {
  readonly id: string;
  readonly seq: number;
  readonly cuerpo?: string;
  readonly enviadoEn?: string;
  readonly deCliente?: boolean;
}): MensajeVista {
  return {
    id: partial.id,
    seq: toDomainSeq(partial.seq),
    cuerpo: partial.cuerpo ?? 'texto',
    enviadoEn: partial.enviadoEn ?? '2026-10-23T14:00:00Z',
    deCliente: partial.deCliente ?? true,
  };
}

function pagina(items: readonly MensajeVista[], hayMas = false): PaginaMensajesVista {
  return { items, hayMas };
}

const CONV_ABIERTA: ConversacionCliente = {
  viaje_id: 'viaje-1',
  estado: 'abierta',
  atendida: false,
};
const CONV_ATENDIDA: ConversacionCliente = {
  viaje_id: 'viaje-1',
  estado: 'abierta',
  atendida: true,
};
const CONV_SOLO_LECTURA: ConversacionCliente = {
  viaje_id: 'viaje-1',
  estado: 'solo_lectura',
  atendida: true,
};

beforeEach(() => {
  obtenerConversacionViaje.mockReset().mockResolvedValue(CONV_ABIERTA);
  listarMensajesViaje.mockReset().mockResolvedValue(pagina([]));
  enviarMensajeViaje.mockReset();
});

afterEach(() => vi.restoreAllMocks());

describe('ConversacionSection — historial y etiqueta de AI27 (E9-T8)', () => {
  it('con mensajes de ambos lados, AI27 se pinta con la etiqueta constante "AI27 Operations"', async () => {
    listarMensajesViaje.mockResolvedValue(
      pagina([
        mensaje({ id: 'm-1', seq: 1, cuerpo: '¿Sigue detenida?', deCliente: true }),
        mensaje({ id: 'm-2', seq: 2, cuerpo: 'Sí, esperando liberación.', deCliente: false }),
      ]),
    );
    renderConQuery(<ConversacionSection viajeId="viaje-1" />);

    expect(await screen.findByText('¿Sigue detenida?')).toBeInTheDocument();
    // El mensaje de AI27 lleva la etiqueta fija; nunca un actor real.
    expect(screen.getByText('AI27 Operations')).toBeInTheDocument();
    expect(screen.getByText('Sí, esperando liberación.')).toBeInTheDocument();
  });

  it('conversación vacía: muestra el estado vacío', async () => {
    renderConQuery(<ConversacionSection viajeId="viaje-1" />);
    expect(await screen.findByText('Sin mensajes todavía')).toBeInTheDocument();
  });

  it('la vista NUNCA renderiza datos internos (actor real, rol, bandeja, reclamo)', async () => {
    listarMensajesViaje.mockResolvedValue(
      pagina([mensaje({ id: 'm-2', seq: 2, cuerpo: 'Respuesta de AI27', deCliente: false })]),
    );
    renderConQuery(<ConversacionSection viajeId="viaje-1" />);

    await screen.findByText('Respuesta de AI27');
    const texto = document.body.textContent ?? '';
    for (const interno of [
      'monitorista',
      'supervisor',
      'coordinador',
      'reclamo',
      'bandeja',
      'pool',
      'actor_real',
    ]) {
      expect(texto).not.toContain(interno);
    }
  });
});

describe('ConversacionSection — indicador atendida (E9-T8, DEC-014)', () => {
  it('muestra "Atendida" cuando la conversación está atendida', async () => {
    obtenerConversacionViaje.mockResolvedValue(CONV_ATENDIDA);
    renderConQuery(<ConversacionSection viajeId="viaje-1" />);
    expect(await screen.findByText('Atendida')).toBeInTheDocument();
  });

  it('no muestra "Atendida" cuando aún no lo está', async () => {
    renderConQuery(<ConversacionSection viajeId="viaje-1" />);
    await screen.findByText('Sin mensajes todavía');
    expect(screen.queryByText('Atendida')).not.toBeInTheDocument();
  });
});

describe('ConversacionSection — envío (E9-T8)', () => {
  it('envía el texto recortado y limpia el campo', async () => {
    enviarMensajeViaje.mockResolvedValue(
      mensaje({ id: 'm-nuevo', seq: 1, cuerpo: 'nuevo mensaje', deCliente: true }),
    );
    const user = userEvent.setup();
    renderConQuery(<ConversacionSection viajeId="viaje-1" />);
    await screen.findByText('Sin mensajes todavía');

    const input = screen.getByLabelText('Nuevo mensaje');
    await user.type(input, '  nuevo mensaje  ');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => expect(enviarMensajeViaje).toHaveBeenCalledTimes(1));
    // El wrapper recibe el cuerpo recortado; el client_message_id lo genera el hook.
    const args = enviarMensajeViaje.mock.calls[0] as [
      string,
      { cuerpo: string; clientMessageId: string },
    ];
    expect(args[0]).toBe('viaje-1');
    expect(args[1].cuerpo).toBe('nuevo mensaje');
    expect(args[1].clientMessageId).toMatch(/[0-9a-f-]{8,}/i);
    expect(input).toHaveValue('');
  });

  it('el botón de enviar está deshabilitado sin texto', async () => {
    const user = userEvent.setup();
    renderConQuery(<ConversacionSection viajeId="viaje-1" />);
    await screen.findByText('Sin mensajes todavía');

    const enviar = screen.getByRole('button', { name: 'Enviar' });
    expect(enviar).toBeDisabled();
    // Solo espacios: sigue deshabilitado.
    await user.type(screen.getByLabelText('Nuevo mensaje'), '   ');
    expect(enviar).toBeDisabled();
  });
});

describe('ConversacionSection — solo lectura / cerrada (E9-T8, DEC-030/DEC-041)', () => {
  it('conversación solo lectura: no ofrece el compositor, explica la razón', async () => {
    obtenerConversacionViaje.mockResolvedValue(CONV_SOLO_LECTURA);
    renderConQuery(<ConversacionSection viajeId="viaje-1" />);

    expect(
      await screen.findByText(/solo lectura: la ventana para escribir se cerró/i),
    ).toBeInTheDocument();
    // Sin compositor: no hay campo ni botón de enviar.
    expect(screen.queryByLabelText('Nuevo mensaje')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument();
  });

  it('un 409 con codigo conversacion_solo_lectura explica que la ventana se cerró', async () => {
    // La conversación estaba abierta al cargar, pero el servidor responde 409 al enviar:
    // se volvió solo lectura en el intervalo. Se ramifica sobre el `codigo` de máquina
    // (en el cuerpo del error), no sobre el status pelado ni el mensaje.
    enviarMensajeViaje.mockRejectedValue(
      new ApiError('conflicto', 'conflicto', 409, 'conversacion_solo_lectura'),
    );
    const user = userEvent.setup();
    renderConQuery(<ConversacionSection viajeId="viaje-1" />);
    await screen.findByText('Sin mensajes todavía');

    await user.type(screen.getByLabelText('Nuevo mensaje'), 'intento tardío');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByText(/ya no admite mensajes: la ventana de escritura se cerró/i),
    ).toBeInTheDocument();
  });

  it('un 409 con OTRO codigo no se presenta como solo lectura', async () => {
    // Si algún día el envío devuelve un 409 por una razón distinta, NO se etiqueta como
    // "ventana cerrada": se ramifica sobre el `codigo` estable, no sobre el status.
    enviarMensajeViaje.mockRejectedValue(
      new ApiError('conflicto', 'conflicto', 409, 'otro_conflicto'),
    );
    const user = userEvent.setup();
    renderConQuery(<ConversacionSection viajeId="viaje-1" />);
    await screen.findByText('Sin mensajes todavía');

    await user.type(screen.getByLabelText('Nuevo mensaje'), 'intento');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    // Se muestra el error genérico, no el texto de solo lectura.
    await waitFor(() => expect(enviarMensajeViaje).toHaveBeenCalled());
    expect(
      screen.queryByText(/ya no admite mensajes: la ventana de escritura se cerró/i),
    ).not.toBeInTheDocument();
  });
});
