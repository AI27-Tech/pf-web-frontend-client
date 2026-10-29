/*
 * Wrapper de transición del cliente (cancelar/rechazar), E1-HU-002 / E9-T7 (AI27-26).
 *
 * Qué se prueba aquí (COMPORTAMIENTO del transporte):
 *   - `transicionarViajeCliente` pega a `POST /viajes/{id}/transiciones-cliente` con el
 *     cuerpo del contrato `TransicionEntrada = { a_estado, causa }`.
 *   - Las dos acciones son distintas: `CANCELADO` y `RECHAZADO_POR_CLIENTE` mandan su
 *     propio `a_estado`. El `causa` SIEMPRE viaja (es obligatorio, DEC-111).
 *   - Devuelve el `ViajeSeguimiento` que responde el servidor, tal cual (sin segundo GET).
 *
 * El `api` se sustituye por un doble: estas pruebas fijan QUÉ se envía y qué se
 * devuelve, no la pila HTTP real (esa tiene sus propias pruebas).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ViajeSeguimiento } from '@/lib/contracts';

const post = vi.fn();
const get = vi.fn();
vi.mock('@/lib/api/client', () => ({ api: { get, post } }));

const { transicionarViajeCliente } = await import('@/lib/api/viajes');

beforeEach(() => {
  post.mockReset();
  get.mockReset();
});

function seguimiento(estado: string, etiqueta: string): ViajeSeguimiento {
  return { id: 'viaje-1', hito: { estado, etiqueta }, eta: null, incidencias: [] };
}

describe('transicionarViajeCliente (E9-T7)', () => {
  it('cancelar manda a_estado=CANCELADO y el motivo en el CUERPO', async () => {
    post.mockResolvedValueOnce(seguimiento('CANCELADO', 'Cancelado'));

    await transicionarViajeCliente('viaje-1', 'CANCELADO', 'Ya no necesito el servicio');

    expect(post).toHaveBeenCalledWith('/viajes/viaje-1/transiciones-cliente', {
      a_estado: 'CANCELADO',
      causa: 'Ya no necesito el servicio',
    });
  });

  it('rechazar manda a_estado=RECHAZADO_POR_CLIENTE: es una acción DISTINTA', async () => {
    post.mockResolvedValueOnce(seguimiento('RECHAZADO_POR_CLIENTE', 'Rechazado'));

    await transicionarViajeCliente('viaje-1', 'RECHAZADO_POR_CLIENTE', 'No acepto esta unidad');

    expect(post).toHaveBeenCalledWith('/viajes/viaje-1/transiciones-cliente', {
      a_estado: 'RECHAZADO_POR_CLIENTE',
      causa: 'No acepto esta unidad',
    });
  });

  it('devuelve el ViajeSeguimiento del servidor tal cual (para refrescar sin otro GET)', async () => {
    const devuelto = seguimiento('CANCELADO', 'Cancelado');
    post.mockResolvedValueOnce(devuelto);

    const resultado = await transicionarViajeCliente('viaje-1', 'CANCELADO', 'motivo');

    expect(resultado).toEqual(devuelto);
    // No hay segundo GET: el único viaje por la red es el POST.
    expect(get).not.toHaveBeenCalled();
  });
});
