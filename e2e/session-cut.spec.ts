import { expect, test } from '@playwright/test';

test('un 401 no recuperable corta la sesión y lleva al login con mensaje', async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'x-mock-session-cut': '1' });

  await page.goto('/login?redirect=/viajes');
  await page.getByLabel('Correo electronico empresarial').fill('cliente@demo.ai27');
  await page.getByLabel('Contrasena', { exact: true }).fill('demo1234');
  await page.getByRole('button', { name: 'Iniciar sesion' }).click();

  await expect(page).toHaveURL(/\/login\?.*motivo=sesion_finalizada/);
  await expect(
    page.getByText('Tu sesión finalizó. Inicia sesión de nuevo para continuar.'),
  ).toBeVisible();
});
