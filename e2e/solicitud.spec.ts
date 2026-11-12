/*
 * "Solicitar nuevo servicio" — alta de servicio del portal (E1-HU-001, E9-T4).
 *
 * El formulario captura la forma del contrato `CrearViajeEntrada`
 * ({ origen, destinos:[{nombre, numero_envio?}], tipo_servicio?, fecha_hora_servicio? })
 * y crea un viaje real (POST /viajes), que entra en `Solicitado`. Reglas cubiertas:
 *   - Origen y destino son obligatorios: el envío está deshabilitado hasta tenerlos.
 *   - Múltiples destinos: el interruptor "Seguimiento con múltiples destinos" permite añadir y quitar destinos
 *     1..N entre el origen y el destino final. Solo ellos se numeran y se pueden reordenar
 *     arrastrándolos; el destino final es siempre el último.
 *   - Tipo de escolta (Patrulla o Moto), fecha y hora son obligatorios; la sobreescolta es opcional.
 *
 * Los campos se localizan por su ROL y nombre accesible (`textbox`/`switch`), no por
 * `getByLabel`: el `FormField` de `@ai27-tech/ui` añade un asterisco de requerido dentro
 * del `<label>`, así que el texto del label es "Destino final*" pero el nombre accesible
 * es "Destino final". El interruptor se alterna pulsando su etiqueta (un overlay
 * estilizado intercepta el clic sobre el input nativo).
 *
 * El asistente rico de 4 pasos sigue desconectado (src/_desconectado/solicitud/); su
 * recorrido se cubre en pruebas unitarias.
 */

import { expect, test, type Page } from '@playwright/test';
import { login } from './support/login';

/** Elige una opción del select de un grupo ("Tipo de escolta", "Tipo de sobreescolta"). */
async function elegirTipoEscolta(
  page: Page,
  grupo: 'Tipo de escolta' | 'Tipo de sobreescolta',
  opcion: 'Patrulla' | 'Moto',
): Promise<void> {
  const select = page.getByRole('group', { name: grupo });
  await select.getByRole('button').click();
  await select.getByRole('button', { name: opcion }).click();
}

/**
 * Completa los obligatorios que no son la ruta: tipo de escolta, fecha y hora. Origen y
 * destino final los llena cada prueba.
 */
async function completarObligatorios(page: Page): Promise<void> {
  await elegirTipoEscolta(page, 'Tipo de escolta', 'Patrulla');
  await page.getByLabel('Fecha del servicio').fill('2026-11-20');
  await page.getByLabel('Hora del servicio').fill('09:30');
}

test.describe('solicitud · formulario mínimo', () => {
  test('el enlace del sidebar lleva al formulario', async ({ page }) => {
    await login(page);

    await page.getByRole('link', { name: 'Solicitar Servicio', exact: true }).click();

    await expect(page).toHaveURL(/\/viajes\/new/);
    await expect(
      page.getByRole('heading', { name: 'Solicitar nuevo servicio', level: 1 }),
    ).toBeVisible();
  });

  test('el envío está deshabilitado mientras falte un obligatorio', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/new');

    const enviar = page.getByRole('button', { name: /Solicitar servicio/ });
    await expect(enviar).toBeDisabled();

    // Solo origen: sigue deshabilitado.
    await page.getByRole('textbox', { name: 'Origen' }).fill('CDMX Vallejo');
    await expect(enviar).toBeDisabled();

    // Origen + destino: aún faltan tipo de escolta, fecha y hora.
    const destino = page.getByRole('textbox', { name: 'Destino final', exact: true });
    await destino.fill('Laredo, US');
    await expect(enviar).toBeDisabled();

    // Con tipo de escolta, fecha y hora: habilitado.
    await completarObligatorios(page);
    await expect(enviar).toBeEnabled();

    // Borrar el destino lo vuelve a deshabilitar.
    await destino.fill('');
    await expect(enviar).toBeDisabled();
  });

  test('agrega y quita paradas; solo las paradas se numeran', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/new');

    await page.getByText('Seguimiento con múltiples destinos').click();
    await expect(page.getByRole('textbox', { name: 'Destino 1', exact: true })).toBeVisible();
    // El destino final no se numera.
    await expect(page.getByRole('textbox', { name: 'Destino final', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Agregar otro destino' }).click();
    await expect(page.getByRole('textbox', { name: 'Destino 2', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Agregar otro destino' }).click();
    await expect(page.getByRole('textbox', { name: 'Destino 3', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Quitar destino 2' }).click();
    await expect(page.getByRole('textbox', { name: 'Destino 3', exact: true })).toBeHidden();
    await expect(page.getByRole('textbox', { name: 'Destino 2', exact: true })).toBeVisible();
  });

  test('arrastrar un destino cambia el orden y el destino final sigue al último', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/viajes/new');

    await page.getByRole('textbox', { name: 'Origen' }).fill('CDMX Vallejo');
    await page.getByRole('textbox', { name: 'Destino final', exact: true }).fill('Laredo, US');
    await page.getByText('Seguimiento con múltiples destinos').click();
    await page.getByRole('textbox', { name: 'Destino 1', exact: true }).fill('Monterrey');
    await page.getByRole('button', { name: 'Agregar otro destino' }).click();
    await page.getByRole('textbox', { name: 'Destino 2', exact: true }).fill('Saltillo');

    // Arrastre real del navegador: el control del Destino 2 se suelta sobre el Destino 1.
    await page
      .getByRole('button', { name: 'Reordenar destino 2' })
      .dragTo(page.getByRole('textbox', { name: 'Destino 1', exact: true }));

    await expect(page.getByRole('textbox', { name: 'Destino 1', exact: true })).toHaveValue(
      'Saltillo',
    );
    await expect(page.getByRole('textbox', { name: 'Destino 2', exact: true })).toHaveValue(
      'Monterrey',
    );
    // El destino final sigue siendo el último punto de la ruta.
    await expect(page.getByRole('textbox', { name: 'Destino final', exact: true })).toHaveValue(
      'Laredo, US',
    );
  });

  test('el teclado reordena: ↓ en el control mueve el destino y conserva el foco', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/viajes/new');

    await page.getByText('Seguimiento con múltiples destinos').click();
    await page.getByRole('textbox', { name: 'Destino 1', exact: true }).fill('Monterrey');
    await page.getByRole('button', { name: 'Agregar otro destino' }).click();
    await page.getByRole('textbox', { name: 'Destino 2', exact: true }).fill('Saltillo');

    await page.getByRole('button', { name: 'Reordenar destino 1' }).focus();
    await page.keyboard.press('ArrowDown');

    await expect(page.getByRole('textbox', { name: 'Destino 1', exact: true })).toHaveValue(
      'Saltillo',
    );
    // El mismo destino ahora es el 2 y su control sigue enfocado: se puede repetir la flecha.
    await expect(page.getByRole('button', { name: 'Reordenar destino 2' })).toBeFocused();
  });

  test('elige tipo de escolta y sobreescolta, y la vista previa los muestra', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/new');

    await elegirTipoEscolta(page, 'Tipo de escolta', 'Patrulla');

    await page.getByText('Agregar sobreescolta').click();
    await elegirTipoEscolta(page, 'Tipo de sobreescolta', 'Moto');

    const vista = page.getByRole('complementary', { name: 'Vista previa de la solicitud' });
    await expect(vista.getByText('Patrulla')).toBeVisible();
    await expect(vista.getByText('Moto')).toBeVisible();
  });

  test('el botón de envío está bajo la vista previa y Enter en un campo también envía', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/viajes/new');

    // El botón es hermano posterior de la vista previa, no parte del formulario.
    const vista = page.getByRole('complementary', { name: 'Vista previa de la solicitud' });
    const enviar = page.getByRole('button', { name: /Solicitar servicio/ });
    const cajaVista = await vista.boundingBox();
    const cajaBoton = await enviar.boundingBox();
    expect(cajaVista).not.toBeNull();
    expect(cajaBoton).not.toBeNull();
    expect(cajaBoton!.y).toBeGreaterThanOrEqual(cajaVista!.y + cajaVista!.height);

    await page.getByRole('textbox', { name: 'Origen' }).fill('CDMX Vallejo');
    await page.getByRole('textbox', { name: 'Destino final', exact: true }).fill('Laredo, US');
    await completarObligatorios(page);
    await page.getByRole('textbox', { name: 'Destino final', exact: true }).press('Enter');

    await expect(page.getByRole('heading', { name: 'Solicitud enviada' })).toBeVisible();
  });

  test('crea un viaje con origen, varias paradas y tipo de servicio hasta Solicitado', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/viajes/new');

    await page.getByRole('textbox', { name: 'Origen' }).fill('CDMX Vallejo');
    await page.getByRole('textbox', { name: 'Destino final', exact: true }).fill('Laredo, US');
    await page.getByText('Seguimiento con múltiples destinos').click();
    await page.getByRole('textbox', { name: 'Destino 1', exact: true }).fill('Monterrey');
    await page.getByRole('button', { name: 'Agregar otro destino' }).click();
    await page.getByRole('textbox', { name: 'Destino 2', exact: true }).fill('Nuevo Laredo');
    // Tipo de servicio: solo hay dos opciones fijas, Local y Foráneo.
    const tipoServicio = page.getByRole('group', { name: 'Tipo de servicio' });
    await tipoServicio.getByRole('button').click();
    await expect(tipoServicio.getByRole('button', { name: 'Local' })).toBeVisible();
    await tipoServicio.getByRole('button', { name: 'Foráneo' }).click();
    await completarObligatorios(page);

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
