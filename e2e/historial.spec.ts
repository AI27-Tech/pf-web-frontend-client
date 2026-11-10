/*
 * El Historial de Viajes, contra el `bff` simulado.
 *
 */

import { expect, test, type Locator, type Page } from '@playwright/test';
import { login } from './support/login';

/**
 * Columna de un filtro de la barra (etiqueta + selector). El `Select` de la librería es
 * un botón que abre una lista, sin `<label for>`, así que se localiza por su etiqueta
 * visible y no por `getByLabel`.
 */
function filtro(page: Page, nombre: string): Locator {
  return page.getByRole('group', { name: nombre });
}

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
    await expect(filtro(page, 'Rango de fechas')).toBeVisible();
    await expect(filtro(page, 'Estado')).toBeVisible();
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

    // Se acota a la tabla: "Cerrado"/"Cancelado" tambien son opciones del filtro.
    const tabla = page.getByRole('table');
    await expect(tabla.getByText('Cerrado').first()).toBeVisible();
    await expect(tabla.getByText('Cancelado')).toBeVisible();
  });
});

test.describe('historial · crece hasta 10 y despues pagina', () => {
  test('con los 15 viajes del mock muestra 10 y pasa a una segunda pagina con 5', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/viajes');
    const tabla = page.getByRole('table');
    const paginacion = page.getByRole('navigation', { name: 'Pagination' });
    await expect(tabla.locator('tbody tr')).toHaveCount(10);

    // Conteo y paginas siempre visibles; hay una segunda pagina.
    await expect(paginacion).toContainText('1–10 of 15');
    await expect(paginacion.getByRole('button', { name: 'Page 1' })).toBeVisible();
    await expect(paginacion.getByRole('button', { name: 'Page 2' })).toBeVisible();

    // La tabla crece con sus filas y la paginacion queda justo debajo: no se estira al
    // alto de la pantalla dejando un hueco entre ambas.
    const cajaTabla = await tabla.boundingBox();
    const cajaPaginacion = await paginacion.boundingBox();
    expect(cajaTabla).not.toBeNull();
    expect(cajaPaginacion).not.toBeNull();
    const huecoPx = cajaPaginacion!.y - (cajaTabla!.y + cajaTabla!.height);
    expect(huecoPx).toBeGreaterThanOrEqual(0);
    expect(huecoPx).toBeLessThan(48);

    // La segunda pagina trae los 5 restantes (viaje-11 a viaje-15).
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(paginacion).toContainText('11–15 of 15');
    await expect(tabla.locator('tbody tr')).toHaveCount(5);
    await expect(page.getByRole('link', { name: 'viaje-15' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'viaje-1', exact: true })).toHaveCount(0);
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
    await filtro(page, 'Estado').getByRole('button').click();
    await filtro(page, 'Estado').getByRole('button', { name: 'Cerrado', exact: true }).click();

    await expect(page).toHaveURL(/[?&]estado=CERRADO/);
    // El mock de bff devuelve solo los CERRADO (viaje-6, viaje-8): dos filas, todas
    // con el chip "Cerrado" y ninguna "En tránsito".
    await expect(tabla.locator('tbody tr')).toHaveCount(2);
    await expect(tabla.getByText('En tránsito')).toHaveCount(0);
    await expect(tabla.getByText('Cerrado').first()).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('1–2 of 2');
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

test.describe('historial · tema oscuro', () => {
  // El tema lo conmuta la libreria @ai27-tech/ui por el atributo `data-theme` en <html>
  // (index.html lo fija en "dark"; no hay toggle en V1). La clase `.dark` no cambia
  // colores: solo `color-scheme`. Por eso la prueba alterna `data-theme`.
  test('el tema oscuro cambia los colores sin tocar ningun componente', async ({ page }) => {
    await login(page);
    await page.goto('/viajes');
    await expect(page.getByRole('table')).toBeVisible();

    const fondoDelBody = () =>
      page.locator('body').evaluate((nodo) => globalThis.getComputedStyle(nodo).backgroundColor);
    const ponerTema = (tema: 'light' | 'dark') =>
      page.evaluate((valor) => {
        globalThis.document.documentElement.dataset['theme'] = valor;
      }, tema);

    await ponerTema('light');
    const cuerpoClaro = await fondoDelBody();

    await ponerTema('dark');
    await expect.poll(fondoDelBody).not.toBe(cuerpoClaro);

    // El contenido sigue ahi: cambia el color, no la informacion.
    await expect(page.getByRole('heading', { name: 'Historial de Viajes' })).toBeVisible();
  });
});
