import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  // `support/` son helpers, no especificaciones.
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  /*
   * Los e2e corren contra el bundle de produccion construido EN MODO MOCK, para que el
   * recorrido autenticado sea comprobable sin backend. Sin `--mode mock` el bundle no
   * incluye msw y solo se podria probar la pantalla de login.
   *
   * `npx` resuelve el binario local sin depender de que gestor de paquetes este en PATH.
   */
  webServer: {
    command: `npx vite build --mode mock && npx vite preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
