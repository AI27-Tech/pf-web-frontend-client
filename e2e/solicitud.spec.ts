/*
 * "Solicitar nuevo servicio" — versión mínima apegada al contrato (recorte E8-T3).
 *
 * El asistente de 4 pasos se desconectó a src/_desconectado/solicitud/ porque el
 * contrato `CrearViajeEntrada` solo acepta origen, destinos, tipo de servicio y fecha.
 * Esta pantalla captura ese subconjunto y crea un viaje real (POST /viajes). El
 * recorrido completo del asistente se conserva en sus pruebas unitarias desconectadas.
 */

import { expect, test } from '@playwright/test';
import { login } from './support/login';

test.describe('solicitud · formulario mínimo', () => {
  test('el enlace del sidebar lleva al formulario', async ({ page }) => {
    await login(page);

    await page.getByRole('link', { name: 'Solicitar Servicio', exact: true }).click();

    await expect(page).toHaveURL(/\/viajes\/new/);
    await expect(
      page.getByRole('heading', { name: 'Solicitar nuevo servicio', level: 1 }),
    ).toBeVisible();
  });

  test('crea un viaje con los campos del contrato y muestra la confirmación', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/new');

    await page.getByLabel('Origen').fill('CDMX Vallejo');
    await page.getByLabel('Destino').fill('Laredo, US');
    await page.getByLabel('Tipo de servicio').selectOption({ label: 'Monitoreo Activo' });

    await page.getByRole('button', { name: /Solicitar servicio/ }).click();

    // El mock devuelve la forma de contrato ViajeResumen con el id del viaje creado.
    await expect(page.getByRole('heading', { name: 'Solicitud enviada' })).toBeVisible();
    await expect(page.getByText('viaje-nuevo')).toBeVisible();

    // "Ver mis viajes" lleva al historial.
    await page.getByRole('button', { name: 'Ver mis viajes' }).click();
    await expect(page).toHaveURL(/\/viajes$/);
  });
});
