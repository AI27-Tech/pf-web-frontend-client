/*
 * Arranque de los mocks. Este archivo es la unica puerta de entrada.
 *
 * Se importa de forma DINAMICA y bajo bandera desde `main.tsx`, asi que ni msw ni los
 * handlers entran en el bundle cuando la bandera esta apagada. Es lo que evita que un
 * backend de mentira acabe embarcado en produccion — y por eso `enableMocks` no debe
 * llamarse nunca desde un import estatico.
 */

/** True solo si se pidio explicitamente. El valor por defecto es "sin mocks". */
export const MOCKS_ENABLED = import.meta.env.VITE_ENABLE_MOCKS === 'true';

export async function enableMocks(): Promise<void> {
  if (!MOCKS_ENABLED) return;

  const [{ setupWorker }, { handlers }] = await Promise.all([
    import('msw/browser'),
    import('./handlers'),
  ]);

  const worker = setupWorker(...handlers);

  await worker.start({
    /*
     * Lo que no tenga handler pasa de largo sin ruido: los modulos del dev server, el
     * HMR y los assets no son peticiones de API y no hay nada que avisar sobre ellos.
     */
    onUnhandledRequest: 'bypass',
    quiet: false,
  });

  console.info(
    '[mocks] bff y realtime simulados. Entra con cliente@demo.ai27 / demo1234.\n' +
      '[mocks] viaje-1 recibe push por SSE · viaje-2 llega degradado · viaje-3 sin datos.',
  );
}
