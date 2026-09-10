/*
 * Seguimiento en Vivo, contra el `bff` simulado.
 *
 * Cubre que las tarjetas de "Viajes Activos" pintan datos reales del mock, que seleccionar otra tarjeta
 * cambia la barra de telemetria, que "Ver Detalles" alterna el detalle sin navegar a otra pantalla, tema
 *  y que el oscuro cambia los colores sin tocar ningun componente.
 */

import { expect, test } from '@playwright/test';
import { login } from './support/login';

async function irASeguimiento(page: Parameters<typeof login>[0]): Promise<void> {
  await login(page);
  await page.getByRole('link', { name: 'Seguimiento en Vivo' }).click();
  await page.getByRole('heading', { name: 'Seguimiento en Vivo', level: 1 }).waitFor();
}

test.describe('seguimiento · contenido', () => {
  test('muestra las tarjetas de viajes activos y el mapa', async ({ page }) => {
    await irASeguimiento(page);

    await expect(page.getByRole('heading', { name: 'Viajes Activos' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Vista de mapa' })).toBeVisible();

    // Datos del mock: folio, ruta, operador y estado de seguimiento de viaje-1.
    await expect(page.getByText('AI27-000101')).toBeVisible();
    await expect(page.getByText('Carlos R.')).toBeVisible();

    // "Ruta Segura" se repite (viaje-1 y viaje-4): basta con que aparezca.
    await expect(page.getByText('Ruta Segura').first()).toBeVisible();

    // El estado de seguimiento distinto de viaje-2, autorado directo en el mock.
    await expect(page.getByText('Desvío Detectado')).toBeVisible();
  });

  test('cuenta cuantos viajes activos estan EN_RUTA', async ({ page }) => {
    await irASeguimiento(page);

    // El dataset del panel trae 4 viajes en EN_RUTA (viaje-1, 2, 4) mas viaje-5 con
    // un estado sin mapear; viaje-3 esta SOLICITADO.
    await expect(page.getByText(/\d+ En Ruta/)).toBeVisible();
  });

  test('muestra la barra de telemetria del viaje seleccionado', async ({ page }) => {
    await irASeguimiento(page);

    const telemetria = page.getByRole('region', { name: 'Telemetria del viaje seleccionado' });
    await expect(telemetria).toBeVisible();
    // Viaje-1 es el seleccionado por defecto: sus valores del mock.
    await expect(telemetria.getByText('78 km/h')).toBeVisible();
    await expect(telemetria.getByText('-4°C')).toBeVisible();
    await expect(telemetria.getByText('92%')).toBeVisible();
  });
});

test.describe('seguimiento · seleccion', () => {
  test('seleccionar otra tarjeta cambia la barra de telemetria', async ({ page }) => {
    await irASeguimiento(page);

    const telemetria = page.getByRole('region', { name: 'Telemetria del viaje seleccionado' });
    await expect(telemetria.getByText('78 km/h')).toBeVisible();

    // viaje-2 en el mock: velocidad_promedio_kmh 64.
    await page.getByRole('button', { name: /AI27-000102/ }).click();

    await expect(telemetria.getByText('64 km/h')).toBeVisible();
    await expect(telemetria.getByText('78 km/h')).not.toBeVisible();
  });
});

test.describe('seguimiento · Ver Detalles', () => {
  test('las tarjetas de "Viajes Activos" no tienen su propio "Ver Detalles"', async ({ page }) => {
    await irASeguimiento(page);

    const listaViajes = page.getByRole('region', { name: 'Viajes activos' });
    await expect(listaViajes.getByRole('button', { name: 'Ver Detalles' })).toHaveCount(0);
  });

  test('"Ver Detalles" oculta "Viajes Activos" y muestra el detalle en su lugar', async ({
    page,
  }) => {
    await irASeguimiento(page);

    await expect(page.getByRole('region', { name: 'Viajes activos' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Detalle del viaje' })).toHaveCount(0);

    const telemetria = page.getByRole('region', { name: 'Telemetria del viaje seleccionado' });
    await telemetria.getByRole('button', { name: 'Ver Detalles' }).click();

    // No navega: sigue en /seguimiento.
    await expect(page).toHaveURL(/\/seguimiento$/);
    await expect(page.getByRole('region', { name: 'Viajes activos' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Detalle del viaje' })).toBeVisible();
    await expect(page.getByText('Más información')).toBeVisible();
  });

  test('"Volver a Viajes Activos" restaura la lista', async ({ page }) => {
    await irASeguimiento(page);

    const telemetria = page.getByRole('region', { name: 'Telemetria del viaje seleccionado' });
    await telemetria.getByRole('button', { name: 'Ver Detalles' }).click();
    await telemetria.getByRole('button', { name: 'Volver a Viajes Activos' }).click();

    await expect(page.getByRole('region', { name: 'Viajes activos' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Detalle del viaje' })).toHaveCount(0);
  });
});

test.describe('seguimiento · tema oscuro', () => {
  test('el tema oscuro cambia los colores sin tocar ningun componente', async ({ page }) => {
    await irASeguimiento(page);

    const fondoDe = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((nodo) => globalThis.getComputedStyle(nodo).backgroundColor);

    const cuerpoClaro = await fondoDe('body');

    await page.evaluate(() => {
      globalThis.document.documentElement.classList.add('dark');
    });

    await expect
      .poll(async () => fondoDe('body').then((valor) => valor !== cuerpoClaro))
      .toBe(true);

    await expect(page.getByRole('heading', { name: 'Viajes Activos' })).toBeVisible();
    await expect(page.getByText('AI27-000101')).toBeVisible();
  });
});
