/*
 * El recorrido autenticado, contra el `bff` simulado de src/mocks/.
 *
 * Estas pruebas no cubren funcionalidad: cubren las INVARIANTES que la arquitectura
 * exige y que solo se pueden observar de punta a punta.
 */

import { expect, test } from '@playwright/test';
import { DEV_USER, login } from './support/login';

test.describe('sesion', () => {
  test('recorrido completo login → segundo factor → panel', async ({ page }) => {
    // El helper `login` llena correo, contrasena y SEGUNDO FACTOR, y envia: un solo
    // paso, un solo POST /sesion. Si el segundo factor no viajara con las credenciales,
    // el mock responderia 401 y este recorrido no llegaria al historial.
    await login(page);
    // La home redirige a `/viajes`: el Panel de Control se cerro mientras
    // `GET /api/v1/panel` no exista en el contrato (ver AppShell / panel.spec.ts).
    await expect(page).toHaveURL('/viajes');
    await expect(
      page.getByRole('heading', { name: 'Historial de Viajes', level: 1 }),
    ).toBeVisible();
  });

  test('credenciales incorrectas se reportan como credenciales, no como otra cosa', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electronico empresarial').fill('nadie@demo.ai27');
    await page.getByLabel('Contrasena', { exact: true }).fill('incorrecta');
    await page.getByLabel('Codigo de verificacion').fill('000000');
    await page.getByRole('button', { name: 'Iniciar sesion' }).click();

    // El mock devuelve 401, y la app lo traduce a fallo de credenciales.
    await expect(page.getByRole('alert').first()).toContainText(/incorrectos/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test('un segundo factor incorrecto da el mismo mensaje, sin revelar que el usuario existe', async ({
    page,
  }) => {
    await page.goto('/login');
    // Credenciales VÁLIDAS pero segundo factor MALO: el IdP (aquí el mock) responde el
    // mismo 401 uniforme (DEC-094). La UI no debe decir "el código es incorrecto" de
    // forma distinta a "la contraseña es incorrecta": eso filtraría que la cuenta
    // existe y que solo falló el factor.
    await page.getByLabel('Correo electronico empresarial').fill(DEV_USER.usuario);
    await page.getByLabel('Contrasena', { exact: true }).fill(DEV_USER.password);
    await page.getByLabel('Codigo de verificacion').fill('999999');
    await page.getByRole('button', { name: 'Iniciar sesion' }).click();

    await expect(page.getByRole('alert').first()).toContainText(/incorrectos/i);
    await expect(page).toHaveURL(/\/login/);
  });
});

/*
 * El seguimiento vivo —las dos rutas de datos (pull + SSE), la posicion marcada por
 * degradacion y el "sin dato"— era V2 y se retiro del release path de V1 (E9-T10 /
 * F-06). Sus pruebas e2e se archivaron con el prototipo en
 * `prototipos-v2/seguimiento-vivo/`. La marca de frescura del ETA, que V1 si usa,
 * se sigue cubriendo en la prueba unitaria de FreshnessMark.
 */

// RECONECTADO (E9-T8 / E3-HU-014, AI27-27): la conversación del viaje volvió al contrato
// —ahora anclada al VIAJE (`/viajes/{id}/conversacion`), no a un `conversacion_id`—. El
// recorrido de orden por secuencia de dominio, envío idempotente y solo lectura se cubre
// en e2e/conversacion.spec.ts; el bloque de `/conversaciones/conv-1` de antes se retiró.

test.describe('viajes', () => {
  test('el detalle muestra el seguimiento curado: hito, ETA e incidencias', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/viaje-2');

    // Recorte al contrato: el detalle es la vista curada `ViajeSeguimiento` (DEC-006).
    // El encabezado usa el id (ya no el folio, que no está en el contrato), y las
    // incidencias se listan por categoría curada, no por tipo interno.
    await expect(page.getByRole('heading', { name: 'Viaje viaje-2' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Incidencias' })).toBeVisible();
    await expect(page.getByText(/Incidencia de seguridad/i)).toBeVisible();
    // El ETA de viaje-2 está marcado obsoleto.
    await expect(page.getByText('(obsoleto)')).toBeVisible();
  });

  test('solicitar un servicio abre el formulario mínimo de alta', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/new');

    /*
     * Recorte al contrato: el alta es un formulario mínimo con los campos de
     * `CrearViajeEntrada` (origen, destino, tipo de servicio, fecha). El asistente
     * rico se conservó desconectado; su recorrido vive en pruebas unitarias.
     */
    await expect(
      page.getByRole('heading', { name: 'Solicitar nuevo servicio', level: 1 }),
    ).toBeVisible();
    await expect(page.getByLabel('Origen')).toBeVisible();
    await expect(page.getByLabel('Destino')).toBeVisible();
  });

  // DESCONECTADO (recorte al contrato): la ruta /viajes/$viajeId/bitacora se retiró
  // porque el contrato bff no define la bitácora. El componente se conserva en
  // src/_desconectado/bitacora/. Reconectar esta prueba al recrear la ruta.
  test.skip('la bitacora visible al cliente se lista', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/viaje-1/bitacora');

    await expect(page.locator('ol li')).toHaveCount(3);
  });
});
