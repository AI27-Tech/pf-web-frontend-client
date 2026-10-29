/*
 * Wrappers de emergencia del cliente (E9-T9, AI27-28).
 *
 * Qué se prueba aquí (COMPORTAMIENTO del transporte, no de la UI):
 *   - `activarEmergencia` manda el `activacion_id` en el CUERPO (la idempotencia es
 *     contractual y viaja en el payload, no en un header). Dos reentregas del MISMO id
 *     producen el mismo caso; dos ids distintos, dos casos. Se verifica contra un `bff`
 *     de mentira CON ESTADO que imita la idempotencia por `activacion_id`.
 *   - `agregarNotaEmergencia` pega a la ruta del caso con `{ cuerpo }`.
 *   - `listEmergencias` lee la vista mínima del cliente.
 *
 * El `api` se sustituye por un doble: estas pruebas fijan QUÉ se envía y cómo se
 * compone la idempotencia, no la pila HTTP real (esa tiene sus propias pruebas).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmergenciaCliente, EmergenciasCliente } from '@/lib/contracts';

const post = vi.fn();
const get = vi.fn();
vi.mock('@/lib/api/client', () => ({ api: { get, post } }));

const { activarEmergencia, agregarNotaEmergencia, listEmergencias } =
  await import('@/lib/api/emergencias');

beforeEach(() => {
  post.mockReset();
  get.mockReset();
});

describe('activarEmergencia — idempotencia por activacion_id (E9-T9)', () => {
  it('manda el activacion_id en el CUERPO, no en un header', async () => {
    post.mockResolvedValueOnce({ id: 'emg-1', estado: 'abierta', activada_en: 'x' });

    await activarEmergencia('viaje-1', { activacion_id: 'act-123' });

    // La ruta y el cuerpo son exactamente los del contrato; nada de Idempotency-Key.
    expect(post).toHaveBeenCalledWith('/viajes/viaje-1/emergencias', {
      activacion_id: 'act-123',
    });
    const options = post.mock.calls[0]?.[2] as { idempotencyKey?: string } | undefined;
    expect(options?.idempotencyKey).toBeUndefined();
  });

  it('dos reentregas del MISMO activacion_id devuelven un solo caso; dos ids, dos casos', async () => {
    // `bff` de mentira con estado: la idempotencia la gobierna el activacion_id.
    const creados = new Map<string, EmergenciaCliente>();
    post.mockImplementation((_path: string, body: { activacion_id: string }) => {
      const existente = creados.get(body.activacion_id);
      if (existente !== undefined) return Promise.resolve(existente);
      const caso: EmergenciaCliente = {
        id: `emg-${creados.size + 1}`,
        estado: 'abierta',
        activada_en: new Date(2026, 0, 1, creados.size).toISOString(),
      };
      creados.set(body.activacion_id, caso);
      return Promise.resolve(caso);
    });

    // Dos REENTREGAS del mismo id (reintento técnico): un solo caso.
    const a1 = await activarEmergencia('viaje-1', { activacion_id: 'press-A' });
    const a2 = await activarEmergencia('viaje-1', { activacion_id: 'press-A' });
    expect(a2.id).toBe(a1.id);
    expect(creados.size).toBe(1);

    // Una PULSACIÓN nueva (otro id): otro caso.
    const b1 = await activarEmergencia('viaje-1', { activacion_id: 'press-B' });
    expect(b1.id).not.toBe(a1.id);
    expect(creados.size).toBe(2);
  });
});

describe('agregarNotaEmergencia (E9-T9)', () => {
  it('pega a la ruta del caso con el cuerpo de la nota', async () => {
    post.mockResolvedValueOnce(undefined);

    await agregarNotaEmergencia('viaje-1', 'emg-1', { cuerpo: 'unidad detenida' });

    expect(post).toHaveBeenCalledWith('/viajes/viaje-1/emergencias/emg-1/notas', {
      cuerpo: 'unidad detenida',
    });
  });
});

describe('listEmergencias (E9-T9)', () => {
  it('lee la vista mínima del cliente', async () => {
    const vista: EmergenciasCliente = {
      emergencia_activa: true,
      casos: [{ id: 'emg-1', estado: 'en_atencion', activada_en: '2026-01-01T00:00:00Z' }],
    };
    get.mockResolvedValueOnce(vista);

    const resultado = await listEmergencias('viaje-1');

    expect(get).toHaveBeenCalledWith('/viajes/viaje-1/emergencias', {});
    expect(resultado).toEqual(vista);
  });
});
