import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '@/app/router';
import { Providers } from '@/app/providers';
import '@fontsource-variable/inter';
// Tokens de diseño de AI27-tech (variables --ui-*). Debe cargarse ANTES de
// globals.css, porque el tema del portal referencia esos tokens con var(--ui-*).
import '@ai27-tech/ui/styles.css';
import '@/styles/globals.css';

const container = document.getElementById('root');
if (container === null) {
  throw new Error('No se encontro #root en index.html');
}

/*
 * Los mocks arrancan ANTES de montar React, para que ninguna peticion de un loader
 * salga antes de que el service worker este escuchando.
 *
 * El acceso por PUNTO es deliberado: es lo que Vite sustituye por la constante
 * literal, de modo que en un build sin mocks la condicion es `false` en tiempo de
 * compilacion y el `import()` de abajo no llega a emitirse como chunk. Con acceso por
 * corchetes, msw acabaria en el bundle de produccion. Ver src/vite-env.d.ts.
 */
async function bootstrap(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { enableMocks } = await import('@/mocks/start');
    await enableMocks();
  }

  createRoot(container as HTMLElement).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  );
}

void bootstrap();
