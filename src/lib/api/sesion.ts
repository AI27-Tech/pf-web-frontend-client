/*
 * Sesion. Contra `bff`, que delega en `identidad`, que a su vez habla con Cognito.
 *
 * El front-end NO habla con Cognito. ADR 8 cierra el proveedor, y bff expone la
 * superficie: POST /sesion, POST /sesion/refresh, DELETE /sesion.
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

import { api } from './client';
import { tokenStore } from './tokenStore';

export interface Credenciales {
  readonly usuario: string;
  readonly password: string;
}

export interface SesionEmitida {
  readonly accessToken: string;
  readonly expiraEn: string;
  /** ADR 13 abierto: si Cognito entrega el OTP, este paso puede no existir. */
  readonly requiereSegundoFactor: boolean;
}

interface SesionWire {
  readonly access_token: string;
  readonly expira_en: string;
  readonly requiere_segundo_factor?: boolean;
}

function toSesion(wire: SesionWire): SesionEmitida {
  return {
    accessToken: wire.access_token,
    expiraEn: wire.expira_en,
    requiereSegundoFactor: wire.requiere_segundo_factor ?? false,
  };
}

export async function login(credenciales: Credenciales): Promise<SesionEmitida> {
  const sesion = toSesion(await api.post<SesionWire>('/sesion', credenciales));
  if (!sesion.requiereSegundoFactor) {
    tokenStore.set(sesion.accessToken, sesion.expiraEn);
  }
  return sesion;
}

/** Punto donde los claims se reevaluan (ver ADR 16). */
export async function refresh(): Promise<SesionEmitida> {
  const sesion = toSesion(await api.post<SesionWire>('/sesion/refresh'));
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
