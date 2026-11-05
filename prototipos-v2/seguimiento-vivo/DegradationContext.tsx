/*
 * Estado de la ruta de datos: push o polling, y por que.
 *
 * Vive en Context y no en cada pantalla porque es una propiedad de la SESION, no de
 * una vista: si el stream se cae, se cae para todo lo que este mirando el usuario, y
 * el aviso pertenece al shell.
 *
 * La regla que este Context existe para hacer cumplir: la degradacion se MUESTRA.
 * "Callarse si, mentir no" — un usuario que ve un mapa quieto tiene derecho a saber
 * si esta quieto porque el camion no se mueve o porque perdimos el stream.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  deriveDegradation,
  initialDegradationState,
  type DegradationState,
} from '@/lib/degradation/mode';
import type { StreamStatus } from '@/lib/stream/streamClient';

interface DegradationValue extends DegradationState {
  /** Lo llama quien tenga el stream abierto; el Context solo deriva y difunde. */
  reportStreamStatus(status: StreamStatus): void;
}

const DegradationContext = createContext<DegradationValue | null>(null);

export function DegradationProvider({ children }: { readonly children: ReactNode }) {
  const [state, setState] = useState<DegradationState>(initialDegradationState);

  /*
   * Estable de por vida: `setState` lo es, asi que esta funcion no necesita
   * dependencias. Importa porque quien abre el stream la usa como dependencia de su
   * efecto — si cambiara de identidad en cada render, el stream se reabriria en cada
   * cambio de estado, que es la tormenta de reconexion que hay que evitar.
   */
  const reportStreamStatus = useCallback((status: StreamStatus) => {
    setState(deriveDegradation(status));
  }, []);

  const value = useMemo<DegradationValue>(
    () => ({ ...state, reportStreamStatus }),
    [state, reportStreamStatus],
  );

  return <DegradationContext.Provider value={value}>{children}</DegradationContext.Provider>;
}

export function useDegradation(): DegradationValue {
  const value = useContext(DegradationContext);
  if (value === null) {
    throw new Error('useDegradation requiere DegradationProvider');
  }
  return value;
}
