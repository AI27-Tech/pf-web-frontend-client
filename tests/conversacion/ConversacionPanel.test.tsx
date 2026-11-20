/*
 * ConversacionPanel — la conversación del cliente como panel de mensajería (E9-T8 /
 * E3-HU-014, AI27-27). Es el aside del detalle, hecho con las piezas de mensajería
 * de `@ai27-tech/ui` (`MessageThread`, `MessageComposer`, `ConversationStatus`).
 *
 * Estados obligatorios del ticket cubiertos aquí:
 *   - con historial: ordenado por secuencia, etiqueta "AI27 Operations" para AI27
 *   - atendida/resuelta: el indicador es visible
 *   - solo lectura / cerrada: el envío está deshabilitado con la razón
 *   - 409 conversacion_solo_lectura: explica y retira el pendiente
 *   - envío fallido: queda como pendiente con "Reintentar" y reusa el mismo id
 *   - viaje sin conversación (404) y error de carga
 *   - la vista NO renderiza datos internos (actor real, rol, bandeja, reclamo)
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

const { ConversacionPanel } = await import('@/features/conversacion/ConversacionPanel');
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
  ultima_secuencia: 0,
};
const CONV_ATENDIDA: ConversacionCliente = { ...CONV_ABIERTA, atendida: true };
const CONV_SOLO_LECTURA: ConversacionCliente = {
  ...CONV_ABIERTA,
  estado: 'solo_lectura',
  atendida: true,
};
const CONV_CERRADA: ConversacionCliente = { ...CONV_ABIERTA, estado: 'cerrada', atendida: true };

/** Monta el panel del viaje: arranca expandido */
function montar(): ReturnType<typeof renderConQuery> {
  return renderConQuery(<ConversacionPanel viajeId="viaje-1" />);
}

const campo = (): HTMLTextAreaElement => screen.getByRole('textbox', { name: 'Mensaje' });
const botonEnviar = (): HTMLButtonElement => screen.getByRole('button', { name: 'Enviar mensaje' });

beforeEach(() => {
  obtenerConversacionViaje.mockReset().mockResolvedValue(CONV_ABIERTA);
  listarMensajesViaje.mockReset().mockResolvedValue(pagina([]));
  enviarMensajeViaje.mockReset();
});

afterEach(() => vi.restoreAllMocks());

describe('ConversacionPanel — historial y etiqueta de AI27 (E9-T8)', () => {
  it('es una columna fija: sin panel flotante, sin minimizar ni cerrar', async () => {
    montar();
    await screen.findByText('Sin mensajes todavía');

    expect(screen.queryByRole('region', { name: 'Muelle de mensajería' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Minimizar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cerrar conversación' })).not.toBeInTheDocument();
    expect(campo()).toBeVisible();
  });

  it('solo pide la conversación y los mensajes de ese viaje', async () => {
    montar();
    await screen.findByText('Sin mensajes todavía');

    expect(obtenerConversacionViaje.mock.calls.every((c) => c[0] === 'viaje-1')).toBe(true);
    expect(listarMensajesViaje.mock.calls.every((c) => c[0] === 'viaje-1')).toBe(true);
  });

  it('con mensajes de ambos lados, AI27 se pinta con la etiqueta constante "AI27 Operations"', async () => {
    listarMensajesViaje.mockResolvedValue(
      pagina([
        mensaje({ id: 'm-1', seq: 1, cuerpo: '¿Sigue detenida?', deCliente: true }),
        mensaje({ id: 'm-2', seq: 2, cuerpo: 'Sí, esperando liberación.', deCliente: false }),
      ]),
    );
    montar();

    expect(await screen.findByText('¿Sigue detenida?')).toBeInTheDocument();
    expect(screen.getByText('AI27 Operations')).toBeInTheDocument();
    expect(screen.getByText('Sí, esperando liberación.')).toBeInTheDocument();
  });

  it('ordena por secuencia de dominio, no por la fecha', async () => {
    listarMensajesViaje.mockResolvedValue(
      pagina([
        mensaje({ id: 'm-b', seq: 2, cuerpo: 'segundo', enviadoEn: '2026-10-23T14:00:00Z' }),
        mensaje({ id: 'm-a', seq: 1, cuerpo: 'primero', enviadoEn: '2026-10-23T14:00:00Z' }),
      ]),
    );
    montar();

    const primero = await screen.findByText('primero');
    const segundo = screen.getByText('segundo');
    expect(primero.compareDocumentPosition(segundo)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('conversación vacía: muestra el estado vacío', async () => {
    montar();
    expect(await screen.findByText('Sin mensajes todavía')).toBeInTheDocument();
  });

  it('la vista NUNCA renderiza datos internos (actor real, rol, bandeja, reclamo)', async () => {
    listarMensajesViaje.mockResolvedValue(
      pagina([mensaje({ id: 'm-2', seq: 2, cuerpo: 'Respuesta de AI27', deCliente: false })]),
    );
    montar();

    await screen.findByText('Respuesta de AI27');
    const texto = document.body.textContent ?? '';
    for (const interno of [
      'monitorista',
      'supervisor',
      'coordinador',
      'reclamo',
      'Reclamada',
      'bandeja',
      'pool',
      'actor_real',
    ]) {
      expect(texto).not.toContain(interno);
    }
  });
});

describe('ConversacionPanel — estado y atendida (E9-T8, DEC-014)', () => {
  it('muestra "Atendida" cuando la conversación está atendida', async () => {
    obtenerConversacionViaje.mockResolvedValue(CONV_ATENDIDA);
    montar();
    expect(await screen.findByText('Atendida')).toBeInTheDocument();
  });

  it('no muestra "Atendida" cuando aún no lo está, pero sí el estado "Abierta"', async () => {
    montar();
    await screen.findByText('Sin mensajes todavía');
    expect(screen.queryByText('Atendida')).not.toBeInTheDocument();
    expect(screen.getByText('Abierta')).toBeInTheDocument();
  });
});

describe('ConversacionPanel — envío (E9-T8)', () => {
  it('envía el texto recortado con un client_message_id y limpia el campo', async () => {
    enviarMensajeViaje.mockResolvedValue(
      mensaje({ id: 'm-nuevo', seq: 1, cuerpo: 'nuevo mensaje', deCliente: true }),
    );
    const user = userEvent.setup();
    montar();
    await screen.findByText('Sin mensajes todavía');

    await user.type(campo(), '  nuevo mensaje  ');
    await user.click(botonEnviar());

    await waitFor(() => expect(enviarMensajeViaje).toHaveBeenCalledTimes(1));
    // El wrapper recibe el cuerpo recortado; el client_message_id lo genera el compositor.
    const args = enviarMensajeViaje.mock.calls[0] as [
      string,
      { cuerpo: string; clientMessageId: string },
    ];
    expect(args[0]).toBe('viaje-1');
    expect(args[1].cuerpo).toBe('nuevo mensaje');
    expect(args[1].clientMessageId).toMatch(/[0-9a-f-]{8,}/i);
    expect(campo()).toHaveValue('');
    expect(await screen.findAllByText('nuevo mensaje')).toHaveLength(1);
  });

  it('el botón de enviar está deshabilitado sin texto', async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText('Sin mensajes todavía');

    expect(botonEnviar()).toBeDisabled();
    await user.type(campo(), '   ');
    expect(botonEnviar()).toBeDisabled();
  });

  it('Enter envía el mensaje', async () => {
    enviarMensajeViaje.mockResolvedValue(mensaje({ id: 'm-1', seq: 1, cuerpo: 'hola' }));
    const user = userEvent.setup();
    montar();
    await screen.findByText('Sin mensajes todavía');

    await user.type(campo(), 'hola{Enter}');

    await waitFor(() => expect(enviarMensajeViaje).toHaveBeenCalledTimes(1));
    const args = enviarMensajeViaje.mock.calls[0] as [string, { cuerpo: string }];
    expect(args[1].cuerpo).toBe('hola');
    expect(campo()).toHaveValue('');
  });

  it('Shift+Enter inserta un salto de línea y NO envía; el cuerpo conserva el salto', async () => {
    enviarMensajeViaje.mockResolvedValue(mensaje({ id: 'm-1', seq: 1, cuerpo: 'x' }));
    const user = userEvent.setup();
    montar();
    await screen.findByText('Sin mensajes todavía');

    await user.type(campo(), 'línea 1{Shift>}{Enter}{/Shift}línea 2');

    expect(enviarMensajeViaje).not.toHaveBeenCalled();
    expect(campo()).toHaveValue('línea 1\nlínea 2');

    await user.click(botonEnviar());
    await waitFor(() => expect(enviarMensajeViaje).toHaveBeenCalledTimes(1));
    const args = enviarMensajeViaje.mock.calls[0] as [string, { cuerpo: string }];
    expect(args[1].cuerpo).toBe('línea 1\nlínea 2');
  });

  it('Enter sin texto (o solo espacios) no envía', async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText('Sin mensajes todavía');

    await user.type(campo(), '   {Enter}');

    expect(enviarMensajeViaje).not.toHaveBeenCalled();
  });

  it('mientras el envío está en vuelo se pinta como pendiente "Enviando…"', async () => {
    let liberar: (m: MensajeVista) => void = () => {};
    enviarMensajeViaje.mockImplementation(
      () =>
        new Promise<MensajeVista>((resolve) => {
          liberar = resolve;
        }),
    );
    const user = userEvent.setup();
    montar();
    await screen.findByText('Sin mensajes todavía');

    await user.type(campo(), 'en camino{Enter}');

    expect(await screen.findByText('Enviando…')).toBeInTheDocument();
    expect(screen.getByText('en camino')).toBeInTheDocument();

    liberar(mensaje({ id: 'm-1', seq: 1, cuerpo: 'en camino' }));
    await waitFor(() => expect(screen.queryByText('Enviando…')).not.toBeInTheDocument());
    expect(screen.getAllByText('en camino')).toHaveLength(1);
  });

  it('un envío fallido queda como "No se envió" y "Reintentar" reusa el mismo client_message_id', async () => {
    enviarMensajeViaje
      .mockRejectedValueOnce(new ApiError('roto', 'POST /mensajes', 500, null))
      .mockResolvedValueOnce(mensaje({ id: 'm-1', seq: 1, cuerpo: 'reintento' }));
    const user = userEvent.setup();
    montar();
    await screen.findByText('Sin mensajes todavía');

    await user.type(campo(), 'reintento{Enter}');
    expect(await screen.findByText('No se envió')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(enviarMensajeViaje).toHaveBeenCalledTimes(2));
    const primero = enviarMensajeViaje.mock.calls[0] as [string, { clientMessageId: string }];
    const segundo = enviarMensajeViaje.mock.calls[1] as [string, { clientMessageId: string }];
    expect(segundo[1].clientMessageId).toBe(primero[1].clientMessageId);
    await waitFor(() => expect(screen.queryByText('No se envió')).not.toBeInTheDocument());
    expect(screen.getAllByText('reintento')).toHaveLength(1);
  });
});

describe('ConversacionPanel — solo lectura / cerrada (E9-T8, DEC-030/DEC-041)', () => {
  it('solo lectura: bloquea el compositor y explica la razón', async () => {
    obtenerConversacionViaje.mockResolvedValue(CONV_SOLO_LECTURA);
    montar();

    expect(
      await screen.findByText(/solo lectura: la ventana para escribir se cerró/i),
    ).toBeInTheDocument();
    expect(campo()).toBeDisabled();
    expect(botonEnviar()).toBeDisabled();
  });

  it('cerrada: bloquea el compositor con la razón de una conversación cerrada', async () => {
    obtenerConversacionViaje.mockResolvedValue(CONV_CERRADA);
    montar();

    expect(await screen.findByText('Esta conversación está cerrada.')).toBeInTheDocument();
    expect(campo()).toBeDisabled();
  });

  it('un 409 con codigo conversacion_solo_lectura explica que la ventana se cerró', async () => {
    // La conversación estaba abierta al cargar, pero el servidor responde 409 al enviar:
    // se volvió solo lectura en el intervalo.
    enviarMensajeViaje.mockRejectedValue(
      new ApiError('conflicto', 'conflicto', 409, 'conversacion_solo_lectura'),
    );
    const user = userEvent.setup();
    montar();
    await screen.findByText('Sin mensajes todavía');

    await user.type(campo(), 'intento tardío{Enter}');

    expect(
      await screen.findByText(/ya no admite mensajes: la ventana de escritura se cerró/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
    expect(screen.queryByText('No se envió')).not.toBeInTheDocument();
  });

  it('un 409 con OTRO codigo no se presenta como solo lectura', async () => {
    enviarMensajeViaje.mockRejectedValue(
      new ApiError('conflicto', 'conflicto', 409, 'otro_conflicto'),
    );
    const user = userEvent.setup();
    montar();
    await screen.findByText('Sin mensajes todavía');

    await user.type(campo(), 'intento{Enter}');

    await waitFor(() => expect(enviarMensajeViaje).toHaveBeenCalled());
    // Se trata como fallo de envío (reintentable), no como ventana cerrada.
    expect(await screen.findByText('No se envió')).toBeInTheDocument();
    expect(
      screen.queryByText(/ya no admite mensajes: la ventana de escritura se cerró/i),
    ).not.toBeInTheDocument();
  });
});

describe('ConversacionPanel — viaje sin conversación y errores de carga', () => {
  it('un 404 no es un fallo: avisa que el viaje no tiene conversación y no deja escribir', async () => {
    obtenerConversacionViaje.mockRejectedValue(new ApiError('noEncontrado', 'GET', 404, null));
    listarMensajesViaje.mockRejectedValue(new ApiError('noEncontrado', 'GET', 404, null));
    montar();

    expect(
      await screen.findByText('Este viaje todavía no tiene una conversación.'),
    ).toBeInTheDocument();
    expect(campo()).toBeDisabled();
    expect(screen.queryByText('Algo se rompió')).not.toBeInTheDocument();
  });

  it('un error de carga se muestra con "Reintentar" que vuelve a pedir', async () => {
    obtenerConversacionViaje.mockRejectedValueOnce(new ApiError('roto', 'GET', 500, null));
    montar();

    expect(await screen.findByText('Algo se rompió')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(obtenerConversacionViaje.mock.calls.length).toBeGreaterThan(1));
    expect(await screen.findByText('Abierta')).toBeInTheDocument();
  });
});

describe('ConversacionPanel — historia anterior (paginación por secuencia)', () => {
  it('"Cargar mensajes anteriores" trae la historia hacia atrás y la antepone', async () => {
    listarMensajesViaje.mockResolvedValueOnce(
      pagina([mensaje({ id: 'm-5', seq: 5, cuerpo: 'reciente' })]),
    );
    listarMensajesViaje.mockResolvedValueOnce(
      pagina([mensaje({ id: 'm-4', seq: 4, cuerpo: 'antiguo' })], false),
    );
    const user = userEvent.setup();
    montar();
    await screen.findByText('reciente');

    await user.click(screen.getByRole('button', { name: 'Cargar mensajes anteriores' }));

    const antiguo = await screen.findByText('antiguo');
    expect(listarMensajesViaje.mock.calls[1]?.[1]).toEqual({ antesDe: 5 });
    expect(antiguo.compareDocumentPosition(screen.getByText('reciente'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    // Al agotarse la historia, el botón desaparece.
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Cargar mensajes anteriores' }),
      ).not.toBeInTheDocument(),
    );
  });
});
