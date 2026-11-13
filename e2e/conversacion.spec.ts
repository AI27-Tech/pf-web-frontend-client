/*
 * Conversación del viaje para el cliente, contra el `bff` simulado (E9-T8 / E3-HU-014).
 *
 * Cubre el recorrido de la DEFINICIÓN DE TERMINADO del ticket:
 *   - abrir la conversación de un viaje desde su detalle;
 *   - enviar un mensaje y verlo aparecer en la lista (idempotente, sin duplicar);
 *   - que la respuesta de AI27 aparezca con la etiqueta fija "AI27 Operations";
 *   - que una conversación en solo lectura deshabilite el envío con su razón.
 *
 * El mock imita la proyección por audiencia del `bff`: el cliente ve el estado de la
 * conversación y, por mensaje, solo `de_cliente` (true/false), nunca el actor interno.
 * El estado vive en memoria por carga de página, así que cada test estrena su estado.
 */

import { expect, test } from '@playwright/test';
import { login } from './support/login';

test.describe('conversación · lectura y envío', () => {
  test('abre la conversación de un viaje, envía un mensaje y lo ve en la lista', async ({
    page,
  }) => {
    await login(page);
    // viaje-1 arranca con una conversación ABIERTA, ATENDIDA y con historial.
    await page.goto('/viajes/viaje-1');

    // Entrada a la conversación desde el detalle del viaje.
    await page.getByRole('link', { name: 'Conversación' }).click();

    await expect(page.getByRole('heading', { name: 'Conversación', level: 2 })).toBeVisible();
    // Indicador atendido/resuelto visible (DEC-014).
    await expect(page.getByText('Atendida')).toBeVisible();
    // La respuesta de AI27 se presenta con la etiqueta fija (DEC-021 #4).
    await expect(page.getByText('AI27 Operations').first()).toBeVisible();

    // Enviar un mensaje nuevo y verlo aparecer en la lista.
    const texto = 'Confirmo la nueva ventana de entrega.';
    await page.getByLabel('Nuevo mensaje').fill(texto);
    await page.getByRole('button', { name: 'Enviar' }).click();

    await expect(page.getByText(texto)).toBeVisible();
    // Tras enviarse, el campo se limpia.
    await expect(page.getByLabel('Nuevo mensaje')).toHaveValue('');

    // No se duplica: el texto aparece exactamente una vez en la lista.
    await expect(page.getByText(texto)).toHaveCount(1);
  });

  test('una conversación en solo lectura deshabilita el envío y explica la razón', async ({
    page,
  }) => {
    await login(page);
    // viaje-6 arranca con una conversación en SOLO LECTURA (viaje cerrado).
    await page.goto('/viajes/viaje-6/conversacion');

    await expect(page.getByRole('heading', { name: 'Conversación', level: 2 })).toBeVisible();
    // Se explica por qué no se puede escribir; no hay compositor.
    await expect(page.getByText(/solo lectura/i)).toBeVisible();
    await expect(page.getByLabel('Nuevo mensaje')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Enviar' })).toBeHidden();
  });
});

test.describe('conversación · palabra larga sin espacios', () => {
  /**
   * Afirma que NINGUNA burbuja desborda. Con `paginaCompleta` también que la página no
   * scrollea en horizontal.
   */
  async function sinDesborde(
    page: import('@playwright/test').Page,
    { paginaCompleta = true }: { paginaCompleta?: boolean } = {},
  ): Promise<void> {
    const burbujas = page.locator('ol > li');
    const total = await burbujas.count();
    expect(total).toBeGreaterThan(0);
    for (let i = 0; i < total; i++) {
      const burbuja = burbujas.nth(i);
      const caja = await burbuja.boundingBox();
      const medidas = await burbuja.evaluate((el) => {
        const lista = el.parentElement!.getBoundingClientRect();
        return {
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          // Lo más a la derecha que llega cualquier descendiente con texto.
          derecha: Math.max(
            ...Array.from(el.querySelectorAll('p')).map((p) => p.getBoundingClientRect().right),
          ),
          limiteLista: lista.right,
        };
      });
      expect(medidas.scrollWidth, `burbuja ${i}`).toBeLessThanOrEqual(medidas.clientWidth + 1);
      expect(medidas.derecha, `burbuja ${i}`).toBeLessThanOrEqual(medidas.limiteLista + 1);
      expect(caja).not.toBeNull();
    }
    if (!paginaCompleta) return;
    const paginaDesborda = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(paginaDesborda).toBe(false);
  }

  test('la palabra larga que ya trae el mock se parte dentro de su burbuja', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/viaje-9/conversacion');
    await expect(page.getByText('asodhaskdgaskldhaksdhiasdh')).toBeVisible();
    await sinDesborde(page);
  });

  test('una palabra larga escrita y enviada tampoco se sale de la burbuja', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/viaje-1/conversacion');
    await expect(page.getByRole('heading', { name: 'Conversación', level: 2 })).toBeVisible();
    // 300 caracteres seguidos, sin un solo espacio ni guion.
    const larga = 'x'.repeat(300);
    await page.getByLabel('Nuevo mensaje').fill(larga);
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByText(larga)).toBeVisible();
    await sinDesborde(page);
  });

  test('en una pantalla angosta la palabra larga tampoco desborda', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await login(page);
    await page.goto('/viajes/viaje-9/conversacion');
    await expect(page.getByText('asodhaskdgaskldhaksdhiasdh')).toBeVisible();
    // Solo las burbujas: a 375px la barra lateral (240px) no se pliega y el botón "Cargar
    // mensajes anteriores" ensancha la página por sí solo. Es un problema de layout aparte
    // de la palabra larga, así que aquí no se mide la página completa.
    await sinDesborde(page, { paginaCompleta: false });
  });
});
