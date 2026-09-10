/*
 * Modal global. El tercer y ultimo Context de la app.
 *
 * Existe para que una confirmacion pueda abrirse desde cualquier profundidad sin
 * pasar props por seis niveles. No es un gestor de estado: no guarda datos de
 * dominio, solo el nodo que se esta mostrando.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface ModalValue {
  readonly content: ReactNode | null;
  open(content: ReactNode): void;
  close(): void;
}

const ModalContext = createContext<ModalValue | null>(null);

export function ModalProvider({ children }: { readonly children: ReactNode }) {
  const [content, setContent] = useState<ReactNode | null>(null);

  const open = useCallback((next: ReactNode) => setContent(next), []);
  const close = useCallback(() => setContent(null), []);

  const value = useMemo<ModalValue>(() => ({ content, open, close }), [content, open, close]);

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal(): ModalValue {
  const value = useContext(ModalContext);
  if (value === null) {
    throw new Error('useModal requiere ModalProvider');
  }
  return value;
}
