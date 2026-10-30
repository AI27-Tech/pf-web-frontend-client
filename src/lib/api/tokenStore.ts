/*
 * Custodia de la sesión.
 *
 * El refreshToken vive únicamente en memoria: no se persiste en localStorage ni
 * sessionStorage. El accessToken y los metadatos de sesión conservan la
 * persistencia provisional existente para que una recarga pueda llegar al
 * siguiente 401; después de la recarga ya no hay refreshToken utilizable y el
 * corte es la reacción esperada.
 */

export interface SessionTokens {
  readonly sesionId: string;
  readonly accessToken: string;
  readonly expiraEn: string;
  readonly refreshToken?: string;
}

export interface TokenStore {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  getSession(): SessionTokens | null;
  set(session: SessionTokens): void;
  clear(): void;
  msHastaExpiracion(now?: number): number | null;
  subscribe(listener: () => void): () => void;
}

const STORAGE_KEY = 'ai27.sesion';
let refreshTokenEnMemoria: string | undefined;

function cargarPersistida(): Omit<SessionTokens, 'refreshToken'> | null {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === null || raw === undefined) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('sesionId' in parsed) ||
      !('accessToken' in parsed) ||
      !('expiraEn' in parsed) ||
      typeof parsed.sesionId !== 'string' ||
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.expiraEn !== 'string'
    ) {
      return null;
    }
    return {
      sesionId: parsed.sesionId,
      accessToken: parsed.accessToken,
      expiraEn: parsed.expiraEn,
    };
  } catch {
    return null;
  }
}

function guardarPersistida(session: SessionTokens): void {
  globalThis.localStorage?.setItem(
    STORAGE_KEY,
    JSON.stringify({
      sesionId: session.sesionId,
      accessToken: session.accessToken,
      expiraEn: session.expiraEn,
    }),
  );
}

function obtenerSesion(): SessionTokens | null {
  const persistida = cargarPersistida();
  if (persistida === null) return null;
  return refreshTokenEnMemoria === undefined
    ? persistida
    : { ...persistida, refreshToken: refreshTokenEnMemoria };
}

function createBrowserTokenStore(): TokenStore {
  const listeners = new Set<() => void>();
  const notify: () => void = () => listeners.forEach((listener) => listener());

  return {
    getAccessToken: () => obtenerSesion()?.accessToken ?? null,
    getRefreshToken: () => refreshTokenEnMemoria ?? null,
    getSession: () => obtenerSesion(),

    set: (session) => {
      refreshTokenEnMemoria = session.refreshToken;
      guardarPersistida(session);
      notify();
    },

    clear: () => {
      refreshTokenEnMemoria = undefined;
      globalThis.localStorage?.removeItem(STORAGE_KEY);
      notify();
    },

    msHastaExpiracion: (now = Date.now()) => {
      const session = obtenerSesion();
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
