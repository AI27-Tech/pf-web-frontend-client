/*
 * Emergencia del cliente, contra el `bff` simulado (E9-T9, AI27-28).
 *
 * Cubre el recorrido de la DEFINICIÓN DE TERMINADO del ticket:
 *   - activar una emergencia (crea y envía de inmediato, sin exigir nota previa);
 *   - agregar una nota a un caso existente;
 *   - que la vista del cliente no exponga datos internos (notas, responsable, Reacción).
 *
 * El mock imita la proyección por audiencia del `bff`: el cliente solo ve el caso por
 * fecha/hora + estado. El estado del mock vive en memoria por carga de página, así que
 * cada test estrena su propio estado (un `goto` recarga la app).
 */

import { expect, test } from '@playwright/test';
import { login } from './support/login';

test.describe('emergencia · activación y notas', () => {
  test('un viaje sin emergencias permite activar una, y el caso aparece en la lista', async ({
    page,
  }) => {
    await login(page);
    // viaje-1 arranca SIN emergencias en el mock.
    await page.goto('/viajes/viaje-1');

    const panel = page.getByRole('heading', { name: 'Emergencia', level: 2 });
    await expect(panel).toBeVisible();
    await expect(page.getByText('Sin emergencias en este viaje.')).toBeVisible();

    // Activar abre la confirmación; confirmar crea el caso de inmediato (sin nota).
    await page.getByRole('button', { name: 'Activar emergencia' }).click();
    await page.getByRole('button', { name: 'Activar ahora' }).click();

    // El caso aparece y el agregado pasa a "activa". Identificado por fecha/hora + estado.
    await expect(page.getByText('Hay una emergencia activa en este viaje.')).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'En atención' })).toBeVisible();
    await expect(page.getByText('Sin emergencias en este viaje.')).toBeHidden();
  });

  test('agrega una nota a un caso existente; una nota vacía no se puede enviar', async ({
    page,
  }) => {
    await login(page);
    // viaje-2 arranca CON un caso en atención (seed del mock).
    await page.goto('/viajes/viaje-2');

    await expect(page.getByText('Hay una emergencia activa en este viaje.')).toBeVisible();

    const agregar = page.getByRole('button', { name: 'Agregar nota' });
    // Sin texto: deshabilitado.
    await expect(agregar).toBeDisabled();

    await page.getByLabel('Nota de emergencia').fill('La unidad quedó detenida en el km 42.');
    await expect(agregar).toBeEnabled();
    await agregar.click();

    // Tras enviarse, el textarea se limpia (la nota se fue) y el botón vuelve a inerte.
    await expect(page.getByLabel('Nota de emergencia')).toHaveValue('');
    await expect(agregar).toBeDisabled();
  });

  test('la vista del cliente no muestra datos internos del caso', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/viaje-2');

    await expect(page.getByRole('listitem').first()).toBeVisible();

    // El cliente nunca ve vocabulario interno: responsable, Reacción, recursos, ni el
    // id técnico del caso. Solo fecha/hora + estado curado.
    const cuerpo = page.getByRole('main');
    await expect(cuerpo).not.toContainText('Reacción');
    await expect(cuerpo).not.toContainText('Responsable');
    await expect(cuerpo).not.toContainText('emg-seed-1');
  });
});
