/*
 * El asistente "Solicitar nuevo servicio", contra el `bff` simulado.
 *
 * Cubre:
 *   - el recorrido completo de los cuatro pasos con los catalogos del mock
 *   - que el borrador se conserva al ir y volver entre pasos.
 *   - que "Editar" desde Revisar salta al paso correcto sin perder lo capturado
 *   - que "Enviar solicitud" (tras confirmar) muestra la confirmacion con un ID
 *     simulado con formato AI27-YYMMDD-NNN, sin crear ningun registro (por ahora).
 *   - que "Volver al inicio" regresa al primer paso con el formulario limpio
 *   - que el tema oscuro cambia los colores sin tocar ningun componente
 */

import { expect, test } from '@playwright/test';
import { login } from './support/login';

/** Llena el paso 1 con datos validos. Deja el asistente listo para Continuar. */
async function llenarServicioYFecha(page: import('@playwright/test').Page): Promise<void> {
  await page.getByRole('radio', { name: /Monitoreo Activo/ }).check({ force: true });
  await page.getByLabel('Fecha de salida *').fill('2026-11-24');
  await page.getByLabel('Hora de salida estimada *').fill('08:00');
  await page.getByLabel('Prioridad del servicio').selectOption({ label: 'Alta' });
  await page.getByLabel('Nombre del contacto en sitio *').fill('Ana G.');
  await page.getByLabel('Teléfono del contacto *').fill('+52 55 1234 5678');
}

test.describe('solicitud · recorrido completo', () => {
  test('el enlace del sidebar lleva al asistente', async ({ page }) => {
    await login(page);

    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Solicitar Servicio' })
      .click();

    await expect(page).toHaveURL(/\/viajes\/new/);
    await expect(
      page.getByRole('heading', { name: 'Solicitar nuevo servicio', level: 1 }),
    ).toBeVisible();
  });

  test('recorre los cuatro pasos, conserva datos y confirma con ID simulado', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/new?paso=servicio');

    // --- Paso 1: Servicio y Fecha ---
    await llenarServicioYFecha(page);
    await page.getByRole('button', { name: /Continuar/ }).click();

    // --- Paso 2: Ruta ---
    const origen = page.getByRole('region', { name: 'Origen' });
    await origen.getByLabel('Nombre del lugar o empresa *').fill('CDMX Vallejo');
    const destino = page.getByRole('region', { name: 'Destino' });
    await destino.getByLabel('Nombre del lugar o empresa *').fill('Laredo, US');

    // El resumen refleja lo capturado, sin inventar distancia.
    const resumen = page.getByRole('region', { name: 'Resumen de Ruta' });
    await expect(resumen.getByText('CDMX Vallejo')).toBeVisible();
    await expect(resumen.getByText('-- km')).toBeVisible();

    // Regresar conserva los datos del paso 1.
    await page.getByRole('button', { name: /Regresar/ }).click();
    await expect(page.getByLabel('Nombre del contacto en sitio *')).toHaveValue('Ana G.');
    await page.getByRole('button', { name: /Continuar/ }).click();

    // Y el paso 2 tambien sigue lleno.
    await expect(
      page.getByRole('region', { name: 'Origen' }).getByLabel('Nombre del lugar o empresa *'),
    ).toHaveValue('CDMX Vallejo');
    await page.getByRole('button', { name: /Continuar/ }).click();

    // --- Paso 3: Detalles ---
    await page.getByLabel('Categoría de la carga').selectOption({ label: 'Electrónicos' });
    await page.getByLabel('Requerimientos del vehículo/unidad').fill('Caja seca 53 pies');
    await page.getByLabel('Alto Valor').check();
    await page.getByRole('button', { name: /Continuar/ }).click();

    // --- Paso 4: Revisar ---
    const servicio = page.getByRole('region', { name: 'Servicio y Fecha' });
    await expect(servicio.getByText('Monitoreo Activo')).toBeVisible();
    await expect(servicio.getByText('Alta')).toBeVisible();

    // "Editar" en Ruta salta al paso 2 sin perder lo capturado.
    await page
      .getByRole('region', { name: 'Ruta' })
      .getByRole('button', { name: /Editar/ })
      .click();
    await expect(page).toHaveURL(/paso=ruta/);
    await expect(
      page.getByRole('region', { name: 'Origen' }).getByLabel('Nombre del lugar o empresa *'),
    ).toHaveValue('CDMX Vallejo');

    // Volver a Revisar y enviar (tras confirmar).
    await page.getByRole('button', { name: /Continuar/ }).click();
    await page.getByRole('button', { name: /Continuar/ }).click();

    const enviar = page.getByRole('button', { name: /Enviar solicitud/ });
    await expect(enviar).toBeDisabled();
    await page.getByLabel(/Confirmo que la información/).check();
    await expect(enviar).toBeEnabled();
    await enviar.click();

    // --- Confirmacion ---
    await expect(page.getByRole('heading', { name: 'Solicitud enviada' })).toBeVisible();
    await expect(page.getByText(/^AI27-\d{6}-\d{3}$/)).toBeVisible();
    const detalles = page.getByRole('region', { name: 'Solicitud enviada' });
    await expect(detalles.getByText(/CDMX Vallejo/)).toBeVisible();
    await expect(detalles.getByText(/Laredo, US/)).toBeVisible();

    // "Volver al inicio" regresa al paso 1 limpio.
    await page.getByRole('button', { name: 'Volver al inicio' }).click();
    await expect(page).toHaveURL(/paso=servicio/);
    await expect(page.getByLabel('Nombre del contacto en sitio *')).toHaveValue('');
    await expect(page.getByRole('radio', { name: /Monitoreo Activo/ })).not.toBeChecked();
  });
});

test.describe('solicitud · tema oscuro', () => {
  test('el tema oscuro cambia los colores sin tocar ningun componente', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/new?paso=servicio');
    await page.getByRole('heading', { name: 'Solicitar nuevo servicio', level: 1 }).waitFor();

    const fondoBody = () =>
      page.locator('body').evaluate((nodo) => globalThis.getComputedStyle(nodo).backgroundColor);

    const claro = await fondoBody();

    await page.evaluate(() => {
      globalThis.document.documentElement.classList.add('dark');
    });

    await expect.poll(async () => (await fondoBody()) !== claro).toBe(true);
  });
});
