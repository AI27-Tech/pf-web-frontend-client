/*
 * El recorrido autenticado, contra el `bff` simulado de src/mocks/.
 *
 * Estas pruebas no cubren funcionalidad: cubren las INVARIANTES que la arquitectura
 * exige y que solo se pueden observar de punta a punta.
 */

import { expect, test } from '@playwright/test';
import { login } from './support/login';

test.describe('sesion', () => {
  test('entra con el usuario de desarrollo y aterriza en el panel', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Viajes en Curso' })).toBeVisible();
    // La tabla del panel pagina a 3 por pagina: 5 viajes en curso, 3 en la primera.
    await expect(page.locator('tbody tr')).toHaveCount(3);
  });

  test('credenciales incorrectas se reportan como credenciales, no como otra cosa', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electronico empresarial').fill('nadie@demo.ai27');
    await page.getByLabel('Contrasena', { exact: true }).fill('incorrecta');
    await page.getByRole('button', { name: 'Iniciar sesion' }).click();

    // El mock devuelve 401, y la app lo traduce a fallo de credenciales.
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

test.describe('conversacion · orden por secuencia de dominio', () => {
  test('ordena por secuencia de dominio y no por orden de llegada', async ({ page }) => {
    await login(page);
    await page.goto('/conversaciones/conv-1');

    await expect(page.locator('ol li').first()).toBeVisible();
    const cuerpos = await page.locator('ol li p:first-child').allInnerTexts();

    /*
     * El mock devuelve los mensajes en orden de `seq` 3, 1, 2 a proposito. Si la app
     * los pintara en el orden recibido, el primero seria "Confirmado…".
     */
    expect(cuerpos[0]).toMatch(/sigue detenida en aduana/i);
    expect(cuerpos[1]).toMatch(/liberacion documental/i);
    expect(cuerpos[2]).toMatch(/Confirmado/i);
  });

  test('enviar un mensaje lo anade a la historia', async ({ page }) => {
    await login(page);
    await page.goto('/conversaciones/conv-2');

    const items = page.locator('ol li');
    const antes = await items.count();

    await page.getByLabel('Nuevo mensaje').fill('Mensaje desde la prueba e2e');
    await page.getByRole('button', { name: 'Enviar' }).click();

    await expect(items).toHaveCount(antes + 1);
    await expect(items.last()).toContainText('Mensaje desde la prueba e2e');
  });
});

test.describe('viajes', () => {
  test('el detalle muestra las condiciones activas superpuestas al estado', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/viaje-2');

    await expect(page.getByRole('heading', { name: /AI27-000102/ })).toBeVisible();
    // Estado y condicion son dos cosas distintas, y se ven las dos.
    await expect(page.getByText('EN_RUTA')).toBeVisible();
    await expect(page.getByText(/Sin senal del dispositivo/i).first()).toBeVisible();
  });

  test('solicitar un servicio abre el asistente en su primer paso', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/new');

    /*
     * El alta de servicio ya no es un formulario unico que POSTea y redirige: es un
     * asistente de cuatro pasos que NO crea registro (no hay backend). El recorrido
     * completo —incluida la confirmacion con ID simulado— vive en `solicitud.spec.ts`;
     * aqui solo se comprueba que la ruta abre el asistente en su primer paso.
     */
    await expect(
      page.getByRole('heading', { name: 'Solicitar nuevo servicio', level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('radio', { name: /Monitoreo Activo/ })).toBeVisible();
  });

  test('la bitacora visible al cliente se lista', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/viaje-1/bitacora');

    await expect(page.locator('ol li')).toHaveCount(3);
  });
});
