/*
 * Configuración del Sidebar: abre un modal con la marca de AI27 y "Cerrar sesión".
 *
 * "Configuración" no es una ruta: es un elemento del Sidebar que abre el `Modal` de
 * `@ai27-tech/ui`. Cerrar sesión ya no es un botón fijo de la barra lateral.
 */
import { expect, test } from '@playwright/test';
import { login } from './support/login';

test.describe('configuración · modal del sidebar', () => {
  test('el sidebar ya no muestra "Cerrar sesión" suelto: está dentro de Configuración', async ({
    page,
  }) => {
    await login(page);
    await expect(
      page.getByRole('navigation', { name: 'Principal' }).getByRole('button', {
        name: 'Cerrar sesión',
      }),
    ).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Configuración' })).toBeVisible();
  });

  test('abre el modal con la marca de AI27 y el botón Cerrar sesión, y Esc lo cierra', async ({
    page,
  }) => {
    await login(page);
    await page.getByRole('button', { name: 'Configuración' }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('AI27', { exact: true })).toBeVisible();
    await expect(modal.getByText('Seguridad Logística')).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });

  test('Cerrar sesión desde el modal lleva al login', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Configuración' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cerrar sesión' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('con el sidebar contraído, Configuración sigue disponible como icono', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Contraer barra lateral' }).click();
    await page.getByRole('button', { name: 'Configuración' }).click();
    await expect(
      page.getByRole('dialog').getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeVisible();
  });
});
