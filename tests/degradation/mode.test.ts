/*
 * La conmutacion push -> polling.
 *
 * El test que importa es el de `vivo-sin-datos`: el socket esta sano y el latido
 * llega, asi que el cliente CREE que esta al dia. Es el modo de falla que el latido
 * disfraza, y la respuesta correcta es degradar a polling, no confiar en el silencio.
 */

import { describe, expect, it } from 'vitest';
import { deriveDegradation, shouldWarnUser } from '@/lib/degradation/mode';

describe('deriveDegradation', () => {
  it('usa push solo cuando el stream esta entregando', () => {
    const state = deriveDegradation('abierto');
    expect(state.mode).toBe('push');
    expect(shouldWarnUser(state)).toBe(false);
  });

  it('degrada a polling cuando el stream esta vivo pero no recibe', () => {
    const state = deriveDegradation('vivo-sin-datos');

    expect(state.mode).toBe('polling');
    // Y se avisa: un stream silencioso y vivo es indistinguible de "no pasa nada".
    expect(shouldWarnUser(state)).toBe(true);
  });

  it('degrada a polling y avisa cuando el stream esta caido', () => {
    const state = deriveDegradation('caido');
    expect(state.mode).toBe('polling');
    expect(shouldWarnUser(state)).toBe(true);
  });

  it('no avisa en el estado inicial: no hay nada que confesar todavia', () => {
    const state = deriveDegradation('inactivo');
    expect(state.mode).toBe('polling');
    expect(shouldWarnUser(state)).toBe(false);
  });
});
