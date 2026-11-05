/*
 * "Solicitar nuevo servicio" — alta de servicio del portal (E1-HU-001, E9-T4).
 *
 * El formulario captura la forma del contrato `CrearViajeEntrada`
 * ({ origen, destinos:[{nombre, numero_envio?}], tipo_servicio?, fecha_hora_servicio? })
 * y crea un viaje real (POST /viajes), que entra en `Solicitado`. Reglas cubiertas:
 *   - Origen y destino son obligatorios: el envío está deshabilitado hasta tenerlos.
 *   - Múltiples paradas: "Agregar paradas" permite añadir y quitar destinos 1..N.
 *
 * Los campos se localizan por su ROL y nombre accesible (`textbox`/`checkbox`), no por
 * `getByLabel`: el `FormField` de `@ai27-tech/ui` añade un asterisco de requerido dentro
 * del `<label>`, así que el texto del label es "Destino*" pero el nombre accesible es
 * "Destino". El checkbox se alterna pulsando su etiqueta (un overlay estilizado
 * intercepta el clic sobre el input nativo).
 *
 * El asistente rico de 4 pasos sigue desconectado (src/_desconectado/solicitud/); su
 * recorrido se cubre en pruebas unitarias.
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

  test('el envío está deshabilitado mientras falte origen o destino', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/new');

    const enviar = page.getByRole('button', { name: /Solicitar servicio/ });
    await expect(enviar).toBeDisabled();

    // Solo origen: sigue deshabilitado.
    await page.getByRole('textbox', { name: 'Origen' }).fill('CDMX Vallejo');
    await expect(enviar).toBeDisabled();

    // Origen + destino: habilitado.
    const destino = page.getByRole('textbox', { name: 'Destino', exact: true });
    await destino.fill('Laredo, US');
    await expect(enviar).toBeEnabled();

    // Borrar el destino lo vuelve a deshabilitar.
    await destino.fill('');
    await expect(enviar).toBeDisabled();
  });

  test('agrega y quita paradas', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/new');

    await page.getByText('Agregar paradas').click();
    await expect(page.getByRole('textbox', { name: 'Destino 1', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Agregar otra parada' }).click();
    await expect(page.getByRole('textbox', { name: 'Destino 2', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Agregar otra parada' }).click();
    await expect(page.getByRole('textbox', { name: 'Destino 3', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Quitar parada 2' }).click();
    await expect(page.getByRole('textbox', { name: 'Destino 3', exact: true })).toBeHidden();
    await expect(page.getByRole('textbox', { name: 'Destino 2', exact: true })).toBeVisible();
  });

  test('crea un viaje con origen, varias paradas y tipo de servicio hasta Solicitado', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/viajes/new');

    await page.getByRole('textbox', { name: 'Origen' }).fill('CDMX Vallejo');
    await page.getByRole('textbox', { name: 'Destino', exact: true }).fill('Laredo, US');
    await page.getByText('Agregar paradas').click();
    await page.getByRole('button', { name: 'Agregar otra parada' }).click();
    await page.getByRole('textbox', { name: 'Destino 2', exact: true }).fill('Nuevo Laredo');
    await page.getByLabel('Tipo de servicio').selectOption({ label: 'Monitoreo Activo' });

    await page.getByRole('button', { name: /Solicitar servicio/ }).click();

    // El mock devuelve la forma de contrato ViajeResumen con el id del viaje creado,
    // en estado SOLICITADO (el estado inicial lo fija el servidor, no el cliente).
    await expect(page.getByRole('heading', { name: 'Solicitud enviada' })).toBeVisible();
    await expect(page.getByText('viaje-nuevo')).toBeVisible();
    await expect(page.getByText(/estado Solicitado/i)).toBeVisible();

    // "Ver mis viajes" lleva al historial.
    await page.getByRole('button', { name: 'Ver mis viajes' }).click();
    await expect(page).toHaveURL(/\/viajes$/);
  });
});
