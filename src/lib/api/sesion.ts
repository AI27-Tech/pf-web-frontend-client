/*
 * Sesion. Contra `bff`, que delega en `identidad`, que a su vez habla con Cognito.
 *
 * El front-end NO habla con Cognito. ADR 8 cierra el proveedor, y bff expone la
 * superficie: POST /sesion, POST /sesion/refresh, DELETE /sesion.
 *
 * La forma del wire (`Sesion`, `CredencialesEntrada`, `RefrescoEntrada`) viene del
 * contrato generado `@ai27-tech/contracts`, no escrita a mano.
 *
 * Dos consecuencias del diseno que la implementacion tiene que respetar:
 *
 *   - El refresco es el punto donde los claims se REEVALUAN, y eso fija la
 *     exposicion maxima en la vida del token. Refrescar con margen no es un detalle
 *     de comodidad: es lo que mantiene acotada esa ventana.
 *
 *   - `sesion.revocada` es el unico mecanismo de revocacion efectiva, porque la
 *     revocacion de Cognito no alcanza a los tokens que se verifican localmente.
 *     Del lado cliente eso se ve como un stream desalojado y un 401 en la siguiente
 *     peticion. Un 401 a media conexion significa "reconecta tras refrescar", no
 *     "error de datos".
 */

import type { components } from '@ai27-tech/contracts/openapi/bff';

import { api } from './client';
import { tokenStore } from './tokenStore';

/** Forma del wire generada por el contrato. */
type SesionWire = components['schemas']['Sesion'];
type CredencialesEntrada = components['schemas']['CredencialesEntrada'];
type RefrescoEntrada = components['schemas']['RefrescoEntrada'];

/** Credenciales de login, en la forma que exige el contrato. */
export type Credenciales = CredencialesEntrada;

/** Modelo de sesion de la app, derivado del wire. */
export interface SesionEmitida {
  /** Id de sesion del cuerpo (`sesion_id`); lo necesita E8-T6/ADR 26 para revocacion. */
  readonly sesionId: string;
  readonly accessToken: string;
  readonly expiraEn: string;
}

/** Traduce el wire del contrato al modelo de la app. Exportada para el contract test. */
export function toSesion(wire: SesionWire): SesionEmitida {
  return {
    sesionId: wire.sesion_id,
    accessToken: wire.access_token,
    expiraEn: wire.expira_en,
  };
}

export async function login(credenciales: Credenciales): Promise<SesionEmitida> {
  const sesion = toSesion(await api.post<SesionWire>('/sesion', credenciales));
  tokenStore.set(sesion.accessToken, sesion.expiraEn);
  return sesion;
}

/**
 * Punto donde los claims se reevaluan (ver ADR 16).
 *
 * TODO(auth): el contrato `RefrescoEntrada` exige `refresh_token` en el cuerpo,
 * pero este portal no lo persiste hoy (tokenStore solo guarda el access_token; la
 * decision localStorage vs cookie httpOnly sigue abierta, ver tokenStore.ts). Con
 * el bff real habra que capturar y enviar el refresh_token aqui. En modo mock el
 * handler no valida el cuerpo, asi que el refresco funciona sin el. Se envia un
 * cuerpo parcial tipado contra el contrato para no inventar un token.
 */
export async function refresh(): Promise<SesionEmitida> {
  const body: Partial<RefrescoEntrada> = {};
  const sesion = toSesion(await api.post<SesionWire>('/sesion/refresh', body));
  tokenStore.set(sesion.accessToken, sesion.expiraEn);
  return sesion;
}

/** bff delega la revocacion en identidad, que publica `sesion.revocada`. */
export async function logout(): Promise<void> {
  try {
    await api.delete<void>('/sesion');
  } finally {
    // El token local se descarta aunque la revocacion falle: dejarlo seria peor.
    tokenStore.clear();
  }
}
