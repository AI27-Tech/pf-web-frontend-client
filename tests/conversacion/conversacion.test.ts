/*
 * Wrappers de la conversación del cliente (E9-T8 / E3-HU-014, AI27-27).
 *
 * Qué se prueba aquí (COMPORTAMIENTO del transporte):
 *   - `enviarMensajeViaje` manda el `client_message_id` en el CUERPO (la idempotencia es
 *     contractual y viaja en el payload, no en un header). Dos reentregas del MISMO id
 *     producen el mismo mensaje; dos ids distintos, dos mensajes. Se verifica contra un
 *     `bff` de mentira CON ESTADO que imita la idempotencia por `client_message_id`.
 *   - `listarMensajesViaje` pagina POR SECUENCIA: `antes_de` (historia) y `despues_de`
 *     (catch-up) se mandan como query, son mutuamente excluyentes, y la respuesta trae
 *     `items` + `hay_mas` (NO hay cursor). La página vuelve ordenada y deduplicada por
 *     secuencia de dominio.
 *   - `obtenerConversacionViaje` lee la vista mínima (estado + atendida).
 *
 * El `api` se sustituye por un doble: estas pruebas fijan QUÉ se envía y cómo se compone
 * la idempotencia y la paginación, no la pila HTTP real (esa tiene sus propias pruebas).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConversacionCliente, MensajeCliente, PaginaMensajesCliente } from '@/lib/contracts';

const post = vi.fn();
const get = vi.fn();
vi.mock('@/lib/api/client', () => ({ api: { get, post } }));

const { enviarMensajeViaje, listarMensajesViaje, obtenerConversacionViaje } =
  await import('@/lib/api/conversacion');

beforeEach(() => {
  post.mockReset();
  get.mockReset();
});

describe('enviarMensajeViaje — idempotencia por client_message_id (E9-T8)', () => {
  it('manda el client_message_id en el CUERPO, no en un header', async () => {
    const wire: MensajeCliente = {
      id: 'm-1',
      secuencia: 1,
      cuerpo: 'hola',
      enviado_en: '2026-10-23T14:00:00Z',
      de_cliente: true,
    };
    post.mockResolvedValueOnce(wire);

    await enviarMensajeViaje('viaje-1', { cuerpo: 'hola', clientMessageId: 'cmid-123' });

    expect(post).toHaveBeenCalledWith('/viajes/viaje-1/conversacion/mensajes', {
      cuerpo: 'hola',
      client_message_id: 'cmid-123',
    });
    // La idempotencia NO viaja en el header del cliente HTTP.
    const options = post.mock.calls[0]?.[2] as { idempotencyKey?: string } | undefined;
    expect(options?.idempotencyKey).toBeUndefined();
  });

  it('dos reentregas del MISMO id devuelven un solo mensaje; dos ids, dos mensajes', async () => {
    // `bff` de mentira con estado: la idempotencia la gobierna el client_message_id.
    const creados = new Map<string, MensajeCliente>();
    post.mockImplementation(
      (_path: string, body: { cuerpo: string; client_message_id: string }) => {
        const existente = creados.get(body.client_message_id);
        if (existente !== undefined) return Promise.resolve(existente);
        const mensaje: MensajeCliente = {
          id: `m-${creados.size + 1}`,
          secuencia: creados.size + 1,
          cuerpo: body.cuerpo,
          enviado_en: new Date(2026, 0, 1, creados.size).toISOString(),
          de_cliente: true,
        };
        creados.set(body.client_message_id, mensaje);
        return Promise.resolve(mensaje);
      },
    );

    // Dos REENTREGAS del mismo id (reintento técnico): un solo mensaje.
    const a1 = await enviarMensajeViaje('viaje-1', { cuerpo: 'hola', clientMessageId: 'cmid-A' });
    const a2 = await enviarMensajeViaje('viaje-1', { cuerpo: 'hola', clientMessageId: 'cmid-A' });
    expect(a2.id).toBe(a1.id);
    expect(creados.size).toBe(1);

    // Un envío nuevo (otro id): otro mensaje.
    const b1 = await enviarMensajeViaje('viaje-1', { cuerpo: 'otra', clientMessageId: 'cmid-B' });
    expect(b1.id).not.toBe(a1.id);
    expect(creados.size).toBe(2);
  });
});

describe('listarMensajesViaje — paginación por secuencia (E9-T8)', () => {
  function pagina(items: MensajeCliente[], hayMas: boolean): PaginaMensajesCliente {
    return { items, hay_mas: hayMas };
  }

  it('sin filtro: no manda antes_de ni despues_de (los más recientes)', async () => {
    get.mockResolvedValueOnce(pagina([], false));

    await listarMensajesViaje('viaje-1');

    // Sin query de paginación: el bff devuelve los más recientes.
    expect(get).toHaveBeenCalledWith('/viajes/viaje-1/conversacion/mensajes', {});
  });

  it('antes_de lee la historia hacia atrás; se manda como query int64', async () => {
    get.mockResolvedValueOnce(pagina([], true));

    const resultado = await listarMensajesViaje('viaje-1', { antesDe: 10, limite: 20 });

    expect(get).toHaveBeenCalledWith('/viajes/viaje-1/conversacion/mensajes', {
      query: { antes_de: 10, limite: 20 },
    });
    // `hay_mas` se propaga tal cual: hay más historia hacia atrás.
    expect(resultado.hayMas).toBe(true);
  });

  it('despues_de recupera lo nuevo (catch-up) tras reconectar', async () => {
    get.mockResolvedValueOnce(pagina([], false));

    await listarMensajesViaje('viaje-1', { despuesDe: 7 });

    expect(get).toHaveBeenCalledWith('/viajes/viaje-1/conversacion/mensajes', {
      query: { despues_de: 7 },
    });
  });

  it('antes_de y despues_de son excluyentes: gana antes_de si llegan los dos', async () => {
    get.mockResolvedValueOnce(pagina([], false));

    await listarMensajesViaje('viaje-1', { antesDe: 5, despuesDe: 2 });

    // Nunca se mandan juntos: el contrato los declara mutuamente excluyentes.
    expect(get).toHaveBeenCalledWith('/viajes/viaje-1/conversacion/mensajes', {
      query: { antes_de: 5 },
    });
  });

  it('ordena por secuencia de dominio y deduplica, aunque lleguen desordenados', async () => {
    // El bff podría devolver un reenvío del mismo id: gana la secuencia mayor.
    const items: MensajeCliente[] = [
      { id: 'm-3', secuencia: 3, cuerpo: 'tercero', enviado_en: 'c', de_cliente: false },
      { id: 'm-1', secuencia: 1, cuerpo: 'primero', enviado_en: 'a', de_cliente: true },
      { id: 'm-2', secuencia: 2, cuerpo: 'segundo', enviado_en: 'b', de_cliente: false },
      // Duplicado de m-1 con secuencia mayor: debe reemplazar al anterior y NO duplicar.
      { id: 'm-1', secuencia: 4, cuerpo: 'primero (editado)', enviado_en: 'd', de_cliente: true },
    ];
    get.mockResolvedValueOnce(pagina(items, false));

    const resultado = await listarMensajesViaje('viaje-1');

    // 3 mensajes únicos, ordenados por secuencia: m-2(2), m-3(3), m-1(4).
    expect(resultado.items.map((m) => m.id)).toEqual(['m-2', 'm-3', 'm-1']);
    expect(resultado.items.map((m) => m.seq)).toEqual([2, 3, 4]);
    // El duplicado ganador conserva el cuerpo de la secuencia mayor.
    expect(resultado.items.at(-1)?.cuerpo).toBe('primero (editado)');
  });
});

describe('obtenerConversacionViaje (E9-T8)', () => {
  it('lee la vista mínima del cliente (estado + atendida)', async () => {
    const vista: ConversacionCliente = { viaje_id: 'viaje-1', estado: 'abierta', atendida: true };
    get.mockResolvedValueOnce(vista);

    const resultado = await obtenerConversacionViaje('viaje-1');

    expect(get).toHaveBeenCalledWith('/viajes/viaje-1/conversacion', {});
    expect(resultado).toEqual(vista);
  });
});
