/* Estado de sesión compartido del portal cliente. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { router } from '@/app/router';
import { SESSION_REFRESH_MARGIN_MS } from '@/lib/constants';
import { login as loginRequest, logout as logoutRequest, refresh } from '@/lib/api/sesion';
import { ApiError } from '@/lib/api/errors';
import type { Credenciales, SesionEmitida } from '@/lib/api/sesion';
import { onCut } from '@/lib/api/sessionCut';
import { tokenStore } from '@/lib/api/tokenStore';

interface SessionValue {
  readonly isAuthenticated: boolean;
  login(credenciales: Credenciales): Promise<SesionEmitida>;
  logout(): Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { readonly children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => tokenStore.getAccessToken() !== null,
  );

  useEffect(
    () => tokenStore.subscribe(() => setIsAuthenticated(tokenStore.getAccessToken() !== null)),
    [],
  );

  useEffect(
    () =>
      onCut((motivo) => {
        tokenStore.clear();
        void router.navigate({
          to: '/login',
          search: { redirect: router.state.location.href, motivo },
        });
      }),
    [],
  );

  useEffect(() => {
    if (!isAuthenticated || tokenStore.getRefreshToken() === null) return;

    const remaining = tokenStore.msHastaExpiracion();
    if (remaining === null) return;

    const delay = Math.max(0, remaining - SESSION_REFRESH_MARGIN_MS);
    const timer = setTimeout(() => {
      void refresh().catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) tokenStore.clear();
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const login = useCallback(async (credenciales: Credenciales) => loginRequest(credenciales), []);

  const logout = useCallback(async () => {
    await logoutRequest();
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ isAuthenticated, login, logout }),
    [isAuthenticated, login, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (value === null) throw new Error('useSession requiere SessionProvider');
  return value;
}
