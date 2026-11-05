/*
 * Sesión contra `bff`, que delega en `identidad`.
 *
 * La forma del wire viene del contrato generado. El refresh_token vive en
 * memoria durante la vida de la pestaña y se envía en el cuerpo del refresco.
 */

import type { components } from '@ai27-tech/contracts/openapi/bff';

import { api } from './client';
import { ApiError } from './errors';
import { restablecerCorte } from './sessionCut';
import { tokenStore, type SessionTokens } from './tokenStore';

type SesionWire = components['schemas']['Sesion'];
type CredencialesEntrada = components['schemas']['CredencialesEntrada'];
type RefrescoEntrada = components['schemas']['RefrescoEntrada'];

export type Credenciales = CredencialesEntrada;

export type SesionEmitida = SessionTokens;

export function toSesion(wire: SesionWire): SesionEmitida {
  return {
    sesionId: wire.sesion_id,
    accessToken: wire.access_token,
    expiraEn: wire.expira_en,
    ...(wire.refresh_token !== undefined ? { refreshToken: wire.refresh_token } : {}),
  };
}

export async function login(credenciales: Credenciales): Promise<SesionEmitida> {
  const sesion = toSesion(await api.post<SesionWire>('/sesion', credenciales));
  tokenStore.set(sesion);
  restablecerCorte();
  return sesion;
}

export async function refresh(): Promise<SesionEmitida> {
  const refreshToken = tokenStore.getRefreshToken();
  if (refreshToken === null) {
    throw new ApiError('noAutorizado', 'No hay refreshToken utilizable.', 401, null);
  }

  const body: RefrescoEntrada = { refresh_token: refreshToken };
  const sesion = toSesion(await api.post<SesionWire>('/sesion/refresh', body));
  tokenStore.set(sesion);
  return sesion;
}

export async function logout(): Promise<void> {
  try {
    await api.delete<void>('/sesion');
  } finally {
    tokenStore.clear();
  }
}
