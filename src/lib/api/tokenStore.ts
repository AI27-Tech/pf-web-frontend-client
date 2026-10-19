/*
 * Custodia del token en el navegador.
 *
 * DECISION ABIERTA — y por eso esto es una interfaz y no una implementacion.
 *
 * Lo que SI esta cerrado (ADR 8): el proveedor de identidad es Amazon Cognito
 * detras del servicio `identidad`, y el front-end hace login contra `bff`
 * (POST /api/v1/sesion), no contra Cognito. Por eso este repo no instala
 * next-auth, aws-amplify ni ningun cliente OIDC.
 *
 * Lo que NO esta cerrado es donde vive el token:
 *
 *   a) localStorage        — comodo, sobrevive al refresco de pagina, y es la peor
 *                            opcion ante XSS: cualquier script inyectado lo lee.
 *   b) memoria + cookie    — el access token en memoria y el refresh en cookie
 *      httpOnly              httpOnly/SameSite. Mas seguro, pero exige que `bff`
 *                            ponga y rote esa cookie, y el contrato no lo dice hoy.
 *
 * La implementacion de abajo es (a) SOLO para que el scaffold arranque, y esta
 * aislada tras esta interfaz precisamente para que elegir (b) sea cambiar un
 * archivo. No propagues `localStorage` al resto de la app.
 *
 * TODO(auth): decidir a) o b) y, si es b), confirmar con el contrato de bff que
 * la cookie de refresh existe. Ver "decisiones abiertas" en el README.
 */

export interface TokenStore {
  getAccessToken(): string | null;
  /** `expiraEn` es ISO-8601. Se usa para refrescar con margen, no para confiar. */
  set(accessToken: string, expiraEn: string): void;
  clear(): void;
  /** Milisegundos hasta la expiracion, o null si no hay sesion. */
  msHastaExpiracion(now?: number): number | null;
  subscribe(listener: () => void): () => void;
}

const STORAGE_KEY = 'ai27.sesion';

interface StoredSession {
  readonly accessToken: string;
  readonly expiraEn: string;
}

function read(): StoredSession | null {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === null || raw === undefined) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'accessToken' in parsed &&
      'expiraEn' in parsed &&
      typeof parsed.accessToken === 'string' &&
      typeof parsed.expiraEn === 'string'
    ) {
      return { accessToken: parsed.accessToken, expiraEn: parsed.expiraEn };
    }
    return null;
  } catch {
    return null;
  }
}

function createBrowserTokenStore(): TokenStore {
  const listeners = new Set<() => void>();
  const notify = (): void => listeners.forEach((listener) => listener());

  return {
    getAccessToken: () => read()?.accessToken ?? null,

    set: (accessToken, expiraEn) => {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify({ accessToken, expiraEn }));
      notify();
    },

    clear: () => {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
      notify();
    },

    msHastaExpiracion: (now = Date.now()) => {
      const session = read();
      if (session === null) return null;
      return new Date(session.expiraEn).getTime() - now;
    },

    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const tokenStore: TokenStore = createBrowserTokenStore();
