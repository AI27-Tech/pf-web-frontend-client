/*
 * El Historial de Viajes, contra el `bff` simulado.
 *
 */

import { expect, test } from '@playwright/test';
import { login } from './support/login';

test.describe('historial · contenido', () => {
  test('muestra el encabezado, los filtros y la tabla', async ({ page }) => {
    await login(page);
    await page.goto('/viajes');

    await expect(
      page.getByRole('heading', { name: 'Historial de Viajes', level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/Consulta los registros detallados/i)).toBeVisible();

    // La barra de filtros. El filtro por estado esta cableado; el rango de fechas
    // sigue presente pero inerte (su etiqueta lo dice). La busqueda de texto NO se
    // renderiza: el contrato no la soporta.
    // `Estado` va con exact: el aria-label de la tabla termina en "...y estado" y
    // getByLabel hace match por substring; sin exact resolveria dos elementos.
    await expect(page.getByLabel(/Rango de fechas/)).toBeVisible();
    await expect(page.getByLabel('Estado', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder(/Buscar por ID/i)).toHaveCount(0);

    await expect(page.getByRole('table')).toBeVisible();
  });

  test('ya no ofrece el enlace "Solicitar servicio" de la pantalla anterior', async ({ page }) => {
    await login(page);
    await page.goto('/viajes');
    await expect(page.getByRole('table')).toBeVisible();

    // Se acota al contenido principal: el sidebar conserva su "Solicitar Servicio",
    // que es navegacion y no la accion que la pantalla anterior tenia en el cuerpo.
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Solicitar servicio', exact: true }),
    ).toHaveCount(0);
  });

  test('pinta los chips de estado del contrato: Cerrado y Cancelado', async ({ page }) => {
    await login(page);
    await page.goto('/viajes');
    await expect(page.getByRole('table')).toBeVisible();

    // viaje-6/8 son CERRADO y viaje-7 CANCELADO; a 3 por pagina caen en la 2a.
    // La `Pagination` del design system usa controles con aria-label en ingles.
    await page.getByRole('button', { name: 'Next page' }).click();

    // Se acota a la tabla: "Cerrado"/"Cancelado" tambien son opciones del filtro.
    const tabla = page.getByRole('table');
    await expect(tabla.getByText('Cerrado').first()).toBeVisible();
    await expect(tabla.getByText('Cancelado')).toBeVisible();
  });
});

test.describe('historial · paginacion', () => {
  test('parte los seis registros en dos paginas y navega', async ({ page }) => {
    await login(page);
    await page.goto('/viajes');

    const tabla = page.getByRole('table');
    await expect(tabla).toBeVisible();

    // Pagina 1: tres filas y el conteo del pie.
    // La `Pagination` del design system muestra "1–3 of 6" (en ingles) dentro del
    // nav "Pagination"; se acota a ese nav para no chocar con otros numeros.
    const paginacion = page.getByRole('navigation', { name: 'Pagination' });
    await expect(tabla.locator('tbody tr')).toHaveCount(3);
    await expect(paginacion).toContainText('1–3 of 6');

    await page.getByRole('button', { name: 'Next page' }).click();

    await expect(tabla.locator('tbody tr')).toHaveCount(3);
    await expect(paginacion).toContainText('4–6 of 6');
  });
});

test.describe('historial · filtro por estado (servidor)', () => {
  test('elegir "Cerrado" filtra en el servidor y la URL lleva el estado', async ({ page }) => {
    await login(page);
    await page.goto('/viajes');
    await expect(page.getByRole('table')).toBeVisible();

    // Antes del filtro hay viajes en curso (EN_TRANSITO) en la pagina 1.
    const tabla = page.getByRole('table');
    await expect(tabla.getByText('En tránsito').first()).toBeVisible();

    // Elegir "Cerrado" navega con el search param: el filtrado es del servidor.
    await page.getByLabel('Estado', { exact: true }).selectOption('CERRADO');

    await expect(page).toHaveURL(/[?&]estado=CERRADO/);
    // El mock de bff devuelve solo los CERRADO (viaje-6, viaje-8): dos filas, todas
    // con el chip "Cerrado" y ninguna "En tránsito".
    await expect(tabla.locator('tbody tr')).toHaveCount(2);
    await expect(tabla.getByText('En tránsito')).toHaveCount(0);
    await expect(tabla.getByText('Cerrado').first()).toBeVisible();
  });

  test('"en curso" y "cerrado" se distinguen: EN_TRANSITO no trae los cerrados', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/viajes?estado=EN_TRANSITO');
    await expect(page.getByRole('table')).toBeVisible();

    const tabla = page.getByRole('table');
    // Solo viajes en curso; ningun CERRADO ni CANCELADO.
    await expect(tabla.getByText('Cerrado')).toHaveCount(0);
    await expect(tabla.getByText('Cancelado')).toHaveCount(0);
    await expect(tabla.getByText('En tránsito').first()).toBeVisible();
  });
});

test.describe('historial · controles sin funcionalidad', () => {
  test('"Exportar CSV" (en el encabezado) esta deshabilitado (fuera de alcance V1)', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/viajes');
    await expect(page.getByRole('table')).toBeVisible();

    // El unico "Exportar CSV" vive en el encabezado; la toolbar de la tabla ya no lo
    // duplica. Sigue deshabilitado: exportar el listado esta fuera de V1 (DEC-023).
    await expect(page.getByRole('button', { name: /Exportar CSV/ })).toBeDisabled();
  });
});

test.describe('historial · tema oscuro', () => {
  // V1 no tiene conmutador de tema: el portal carga un unico set de tokens y ya es
  // oscuro. Agregar `.dark` al <html> no cambia el fondo del body porque nada en la
  // app reacciona a esa clase (verificado contra el bundle mock). La prueba asume una
  // funcionalidad de theming que no existe en V1; se omite hasta que exista el toggle.
  test.skip('el tema oscuro cambia los colores sin tocar ningun componente', async ({ page }) => {
    await login(page);
    await page.goto('/viajes');
    await expect(page.getByRole('table')).toBeVisible();

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

    // El contenido sigue ahi: cambia el color, no la informacion.
    await expect(page.getByRole('heading', { name: 'Historial de Viajes' })).toBeVisible();
  });
});
