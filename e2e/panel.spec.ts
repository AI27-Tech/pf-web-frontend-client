/*
 * El Panel de Control, contra el `bff` simulado. SUITE CONGELADA (`describe.skip`).
 *
 * El acceso al panel se cerro: su pantalla pegaba a `GET /api/v1/panel`, un endpoint
 * que no existe en el contrato (`contracts/openapi/bff.yaml`), y la home ahora redirige
 * a `/viajes` (ver src/routes/_private/index.tsx y AppShell). Estas pruebas asumen que
 * `login()` deja al usuario viendo el panel en `/`, cosa que ya no ocurre, asi que se
 * congelan junto con el panel en lugar de reescribirse para una ubicacion que no existe
 * en producto. Se reactivan cuando se resuelva la decision diferida de §9 del plan:
 * congelar `/panel` como superficie del `bff`, o recomponer el panel con las superficies
 * que V1 si tiene. El codigo del panel sigue en el repo (`features/panel/`), no se borro.
 *
 * Lo que cubrian y seguira importando cuando el panel vuelva:
 *   - que la ruta agregada `/api/v1/panel` llega, se parsea y se pinta
 *   - que el grid recoloca de verdad en tres anchos distintos (jsdom no aplica media
 *     queries, asi que la prueba unitaria solo puede mirar las clases)
 *   - que el tema oscuro cambia los colores SIN tocar ningun componente, que es la
 *     prueba de que el panel consume roles y no colores crudos
 */

import { expect, test, type Page } from '@playwright/test';
import { login } from './support/login';

/** Ancho de las tres vistas del diseno responsive. */
const VISTAS = {
  movil: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  escritorio: { width: 1440, height: 900 },
} as const;

/** Columnas efectivas de un grid, leidas del layout ya calculado por el navegador. */
async function columnasDe(page: Page, selector: string): Promise<number> {
  return page
    .locator(selector)
    .first()
    .evaluate((nodo) => {
      const columnas = globalThis.getComputedStyle(nodo).gridTemplateColumns;
      return columnas.split(' ').filter((valor) => valor.trim().length > 0).length;
    });
}

test.describe.skip('panel · contenido', () => {
  test('muestra los indicadores, la tabla, el mapa y las notificaciones', async ({ page }) => {
    await login(page);

    // Los tres indicadores, con su valor y su contexto.
    await expect(page.getByText('24', { exact: true })).toBeVisible();
    await expect(page.getByText('+3 desde ayer')).toBeVisible();
    await expect(page.getByText('Bajo / Normal')).toBeVisible();
    await expect(page.getByText('98% de unidades seguras')).toBeVisible();
    await expect(page.getByText('Requieren atención inmediata')).toBeVisible();

    // Las tres zonas del cuerpo.
    await expect(page.getByRole('heading', { name: 'Viajes en Curso' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Vista de mapa' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Notificaciones Recientes' })).toBeVisible();
  });

  test('la tabla cuenta tres verdades distintas sobre el ETA', async ({ page }) => {
    await login(page);

    const tabla = page.getByRole('table');
    // La tabla pagina a 3 por pagina; los tres viajes con ETA distinto caen en la 1a.
    await expect(tabla.locator('tbody tr')).toHaveCount(3);

    // Presente: hora concreta. El mock lo fija hoy a las 18:30.
    await expect(page.getByText('Hoy, 18:30')).toBeVisible();
    const marca = page.getByRole('status').filter({ hasText: 'ETA no disponible' });
    await expect(marca).toBeVisible();
    await expect(marca).toHaveAttribute('title', /procesamiento no disponible/);
    // Sin dato: nunca hubo ETA, y eso no es degradacion.
    await expect(page.getByText('Pendiente')).toBeVisible();
  });

  test('los chips de estado reflejan la condicion activa, no solo el estado', async ({ page }) => {
    await login(page);

    await expect(page.getByText('En Ruta').first()).toBeVisible();
    await expect(page.getByText('Retrasado').first()).toBeVisible();
    await expect(page.getByText('Solicitado')).toBeVisible();
    // EN_ADUANA es viaje-5: con la tabla paginada a 3 por pagina cae en la segunda.
    await page.getByRole('button', { name: 'Pagina siguiente' }).click();
    await expect(page.getByText('EN_ADUANA')).toBeVisible();
  });

  test('el ETA nunca excede el maximo de caracteres acordado', async ({ page }) => {
    await login(page);

    const textos = await page.locator('tbody tr td:nth-child(4)').allInnerTexts();

    for (const texto of textos) {
      // 19 caracteres: caso más largo "17 Sep 2026, 18:30".
      expect(texto.trim().length).toBeLessThanOrEqual(19);
    }
  });
});

test.describe.skip('panel · acciones', () => {
  test('"Solicitar Servicio" lleva al formulario de solicitud', async ({ page }) => {
    await login(page);

    const acciones = page.getByRole('region', { name: 'Acciones rapidas' });
    await acciones.getByRole('link', { name: 'Solicitar Servicio' }).click();

    // El enlace lleva el paso inicial como search param (?paso=servicio).
    await expect(page).toHaveURL(/\/viajes\/new/);
  });

  test('"Descargar Reporte" existe y no navega', async ({ page }) => {
    await login(page);

    const descargar = page.getByRole('button', { name: 'Descargar Reporte' });
    await expect(descargar).toBeEnabled();
    await descargar.click();
    // Sin funcionalidad definida todavia: no navega y no rompe.
    await expect(page).toHaveURL('/');
  });

  test('"Ver todos" lleva al listado completo de viajes', async ({ page }) => {
    await login(page);

    await page.getByRole('link', { name: 'Ver todos' }).click();

    await expect(page).toHaveURL(/\/viajes$/);
  });
});

test.describe.skip('panel · responsive', () => {
  test('los indicadores pasan de una a dos y a cuatro columnas', async ({ page }) => {
    await login(page);

    await page.setViewportSize(VISTAS.movil);
    expect(await columnasDe(page, '.grid')).toBe(1);

    await page.setViewportSize(VISTAS.tablet);
    expect(await columnasDe(page, '.grid')).toBe(2);

    await page.setViewportSize(VISTAS.escritorio);
    expect(await columnasDe(page, '.grid')).toBe(4);
  });

  test('en movil el cuerpo se apila y la tabla scrollea en lugar de comprimirse', async ({
    page,
  }) => {
    await login(page);
    await page.setViewportSize(VISTAS.movil);

    const tabla = page.getByRole('table');
    await expect(tabla).toBeVisible();

    // El contenedor de la tabla scrollea: el contenido es mas ancho que el espacio.
    const scrollea = await tabla.evaluate((nodo) => {
      const contenedor = nodo.parentElement;
      return contenedor !== null && contenedor.scrollWidth > contenedor.clientWidth;
    });
    expect(scrollea).toBe(true);

    // Y el mapa queda por debajo de la tabla, no al lado.
    const cajaTabla = await tabla.boundingBox();
    const cajaMapa = await page.getByRole('region', { name: 'Vista de mapa' }).boundingBox();
    expect(cajaMapa?.y ?? 0).toBeGreaterThan(cajaTabla?.y ?? 0);
  });

  test('en escritorio la tabla y la columna derecha van lado a lado', async ({ page }) => {
    await login(page);
    await page.setViewportSize(VISTAS.escritorio);

    const cajaTabla = await page.getByRole('table').boundingBox();
    const cajaMapa = await page.getByRole('region', { name: 'Vista de mapa' }).boundingBox();

    // El mapa arranca a la derecha de donde termina la tabla.
    expect(cajaMapa?.x ?? 0).toBeGreaterThan(cajaTabla?.x ?? 0);
  });
});

test.describe.skip('panel · tema oscuro', () => {
  test('el tema oscuro cambia los colores sin tocar ningun componente', async ({ page }) => {
    await login(page);

    const fondoDe = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((nodo) => globalThis.getComputedStyle(nodo).backgroundColor);

    const cuerpoClaro = await fondoDe('body');
    const chipClaro = await fondoDe('tbody tr td:nth-child(3) span');

    /*
     * El tema se controla anadiendo `.dark` en <html>. No hay conmutador en la app
     * todavia, asi que la prueba lo pone a mano: lo que se comprueba es que TODOS los
     * roles cambian de golpe, que es la propiedad del sistema de color.
     */
    await page.evaluate(() => {
      globalThis.document.documentElement.classList.add('dark');
    });

    await expect
      .poll(async () => fondoDe('body').then((valor) => valor !== cuerpoClaro))
      .toBe(true);

    expect(await fondoDe('tbody tr td:nth-child(3) span')).not.toBe(chipClaro);

    // El contenido sigue ahi: cambia el color, no la informacion.
    await expect(page.getByRole('heading', { name: 'Viajes en Curso' })).toBeVisible();
    await expect(page.getByText('Hoy, 18:30')).toBeVisible();
  });
});
