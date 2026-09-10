import type { Page } from '@playwright/test';

/** Credenciales del `bff` simulado. Ver src/mocks/data.ts. */
export const DEV_USER = {
  usuario: 'cliente@demo.ai27',
  password: 'demo1234',
} as const;

export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Correo electronico empresarial').fill(DEV_USER.usuario);
  await page.getByLabel('Contrasena', { exact: true }).fill(DEV_USER.password);
  await page.getByRole('button', { name: 'Iniciar sesion' }).click();
  // Tras autenticarse, la home es el Panel de Control.
  await page.getByRole('heading', { name: 'Panel de Control', level: 1 }).waitFor();
}
