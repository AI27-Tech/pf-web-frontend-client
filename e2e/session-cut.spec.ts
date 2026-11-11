import { expect, test } from '@playwright/test';

test('un 401 no recuperable corta la sesión y lleva al login con mensaje', async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'x-mock-session-cut': '1' });

  await page.goto('/login?redirect=/viajes');
  await page.getByLabel('Correo electrónico empresarial').fill('cliente@demo.ai27');
  await page.getByLabel('Contraseña', { exact: true }).fill('demo1234');
  // El login exige el segundo factor; sin él, el 401 sería del propio login y nunca se
  // ejercitaría el corte de sesión, que es lo que esta prueba observa.
  await page.getByLabel('Código de verificación').fill('123456');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page).toHaveURL(/\/login\?.*motivo=sesion_finalizada/);
  await expect(
    page.getByText('Tu sesión finalizó. Inicia sesión de nuevo para continuar.'),
  ).toBeVisible();
});
