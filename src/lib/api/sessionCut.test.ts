import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from './errors';
import { request } from './client';
import { cortarSesion, onCut, restablecerCorte } from './sessionCut';
import { tokenStore, type SessionTokens } from './tokenStore';

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));
vi.mock('./refreshCoordinator', () => ({ refrescarSesionCoordinado: refreshMock }));

const sesion: SessionTokens = {
  sesionId: 'ses-1',
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  expiraEn: new Date(Date.now() + 60_000).toISOString(),
};

function respuestaJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('corte de sesión e interceptor 401 cliente', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    refreshMock.mockReset();
    tokenStore.clear();
    restablecerCorte();
  });

  it('refresca y reintenta una sola vez', async () => {
    tokenStore.set(sesion);
    const renovada = { ...sesion, accessToken: 'access-2' };
    refreshMock.mockImplementation(async () => {
      tokenStore.set(renovada);
      return renovada;
    });
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(respuestaJson({ id: 'viaje-1' }));

    await expect(request('/viajes')).resolves.toEqual({ id: 'viaje-1' });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('corta si el refresco responde 401', async () => {
    tokenStore.set(sesion);
    refreshMock.mockRejectedValue(new ApiError('noAutorizado', 'rechazado', 401, null));
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(request('/viajes')).rejects.toMatchObject({ kind: 'sesionFinalizada' });
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('corta sin refrescar cuando no hay refreshToken', async () => {
    const sesionSinRefresh = {
      sesionId: sesion.sesionId,
      accessToken: sesion.accessToken,
      expiraEn: sesion.expiraEn,
    };
    tokenStore.set(sesionSinRefresh);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(request('/viajes')).rejects.toMatchObject({ kind: 'sesionFinalizada' });
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('conserva la sesión ante un fallo de red del refresco', async () => {
    tokenStore.set(sesion);
    refreshMock.mockRejectedValue(new ApiError('roto', 'sin red', null, null));
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(request('/viajes')).rejects.toMatchObject({ kind: 'roto' });
    expect(tokenStore.getSession()).toEqual(sesion);
  });

  it('emite el corte una sola vez a los suscriptores', () => {
    const listener = vi.fn();
    const unsubscribe = onCut(listener);

    expect(cortarSesion()).toBe(true);
    expect(cortarSesion()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('sesion_finalizada');

    unsubscribe();
  });
});
