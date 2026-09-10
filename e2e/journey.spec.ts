/*
 * El recorrido autenticado, contra el `bff` y el `realtime` simulados de src/mocks/.
 *
 * Estas pruebas no cubren funcionalidad: cubren las INVARIANTES que la arquitectura
 * exige y que solo se pueden observar de punta a punta.
 *
 * Nota de mecanica: en las rutas con stream no se puede esperar a 'networkidle' — el
 * SSE nunca deja la red quieta. Se espera a elementos concretos.
 */

import { expect, test } from '@playwright/test';
import { login } from './support/login';

test.describe('sesion', () => {
  test('entra con el usuario de desarrollo y aterriza en el panel', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Viajes en Curso' })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(5);
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

test.describe('tracking · las dos rutas de datos', () => {
  test('la posicion se actualiza por push sin recargar', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/viaje-1/tracking');
    await expect(page.getByRole('heading', { name: 'Seguimiento' })).toBeVisible();

    const posicion = page.locator('section', { hasText: 'Posicion' }).first();
    await expect(posicion).toBeVisible();

    const inicial = await posicion.innerText();

    /*
     * El mock emite una posicion nueva cada 2 s, con la secuencia de dominio
     * avanzando. Si el texto cambia sin navegar, la ruta push esta entregando y el
     * parser la esta leyendo — con el mismo codigo que la ruta pull.
     */
    await expect(async () => {
      expect(await posicion.innerText()).not.toBe(inicial);
    }).toPass({ timeout: 15_000 });
  });
});

test.describe('tracking · ausente por degradacion no es ausente', () => {
  test('un payload degradado marca la ausencia y conserva el estado', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/viaje-2/tracking');

    // El estado del viaje sigue sirviendose: el payload es parcial, no vacio.
    await expect(page.getByText('EN_RUTA')).toBeVisible();

    // Y la ausencia viaja MARCADA: con motivo, y con el ultimo dato etiquetado.
    const marca = page.getByRole('status').first();
    await expect(marca).toContainText(/Sin posicion en este momento/i);
    await expect(marca).toContainText(/procesamiento no disponible/i);
    await expect(marca).toContainText(/no actualizado/i);

    // El mapa se calla en lugar de dibujar un marcador viejo.
    await expect(page.getByText(/Sin posicion que dibujar/i)).toBeVisible();
  });

  test('"sin dato" no se presenta como degradacion', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/viaje-3/tracking');

    await expect(page.getByText(/Sin posicion registrada/i)).toBeVisible();
    // Ni una sola marca de degradacion: nunca hubo dato, y eso es otra cosa.
    await expect(page.getByRole('status')).toHaveCount(0);
  });
});

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
    await expect(page.getByText(/Retrasado/i).first()).toBeVisible();
  });

  test('solicitar un servicio redirige a su detalle', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/new');

    await page.getByLabel('Origen').fill('CDMX · Iztapalapa');
    await page.getByLabel('Destino').fill('Puebla · Centro');
    await page.getByLabel('Requerido para').fill('2026-09-10T09:00');
    await page.getByRole('button', { name: 'Solicitar servicio' }).click();

    await expect(page).toHaveURL(/\/viajes\/viaje-3$/);
  });

  test('la bitacora visible al cliente se lista', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/viaje-1/bitacora');

    await expect(page.locator('ol li')).toHaveCount(3);
  });
});
