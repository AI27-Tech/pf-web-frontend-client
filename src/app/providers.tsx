import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from './queryClient';
import { SessionProvider } from '@/context/SessionContext';
import { ModalProvider } from '@/context/ModalContext';

export function Providers({ children }: { readonly children: ReactNode }) {
  // Una instancia por montaje: en tests cada render arranca con cache limpia.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ModalProvider>{children}</ModalProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
