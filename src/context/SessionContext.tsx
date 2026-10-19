/*
 * Estado de sesion compartido.
 *
 * Es uno de los TRES casos de estado global de cliente que esta app tiene (sesion,
 * stream, degradacion). Todo lo demas es estado de servidor y es de TanStack Query,
 * o estado local del componente que lo usa. Si aparece un cuarto Context, conviene
 * preguntarse si de verdad es estado de cliente.
 *
 * El bucle de refresco vive aqui porque el refresco es el punto donde los claims se
 * REEVALUAN, y eso fija la exposicion maxima en la vida del token. Dejar que expire
 * y reaccionar al 401 funciona, pero amplia esa ventana sin necesidad.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { SESSION_REFRESH_MARGIN_MS } from '@/lib/constants';
import { login as loginRequest, logout as logoutRequest, refresh } from '@/lib/api/sesion';
import type { Credenciales, SesionEmitida } from '@/lib/api/sesion';
import { tokenStore } from '@/lib/api/tokenStore';

interface SessionValue {
  readonly isAuthenticated: boolean;
  readonly requiereSegundoFactor: boolean;
  login(credenciales: Credenciales): Promise<SesionEmitida>;
  logout(): Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { readonly children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => tokenStore.getAccessToken() !== null,
  );
  const [requiereSegundoFactor, setRequiereSegundoFactor] = useState(false);

  // El token vive tras `tokenStore`; este Context solo refleja su presencia.
  useEffect(
    () => tokenStore.subscribe(() => setIsAuthenticated(tokenStore.getAccessToken() !== null)),
    [],
  );

  /*
   * Refresco proactivo con margen. Un solo temporizador reprogramado en cada
   * cambio de sesion, no un intervalo: la vida del token no es fija.
   *
   * TODO(ADR 16): esto asume que el trigger de pre-generacion de Cognito reevalua
   * los claims en el flujo de refresco. Si NO lo hace, un cambio de rol no se
   * refleja hasta un relogin, y hace falta una ruta de relogin forzado.
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    const remaining = tokenStore.msHastaExpiracion();
    if (remaining === null) return;

    const delay = Math.max(0, remaining - SESSION_REFRESH_MARGIN_MS);
    const timer = setTimeout(() => {
      void refresh().catch(() => tokenStore.clear());
    }, delay);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const login = useCallback(async (credenciales: Credenciales) => {
    const sesion = await loginRequest(credenciales);
    setRequiereSegundoFactor(sesion.requiereSegundoFactor);
    return sesion;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setRequiereSegundoFactor(false);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ isAuthenticated, requiereSegundoFactor, login, logout }),
    [isAuthenticated, requiereSegundoFactor, login, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error('useSession requiere SessionProvider');
  }
  return value;
}
