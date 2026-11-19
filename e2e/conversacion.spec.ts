/*
 * Conversación del viaje como panel lateral del shell, contra el `bff` simulado
 * (E9-T8 / E3-HU-014).
 *
 * El detalle de un viaje tiene Seguimiento y Acciones, y a la derecha de toda la página una
 * columna fija con la conversación de ese viaje (como el Sidebar de la izquierda, pero del
 * otro lado): arranca EXPANDIDA y se contrae a una franja angosta con el icono de mensaje, que la
 * vuelve a expandir (no hay botón de ocultar o mostrar en el encabezado de la página). Se pide solo la conversación de ese viaje. No hay panel flotante,
 * muelle ni lista de conversaciones, ni página propia.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';
import { login } from './support/login';

async function irAlViaje(page: Page, viajeId: string): Promise<Locator> {
  await page.goto(`/viajes/${viajeId}`);
  const panel = page.getByRole('complementary', { name: 'Conversación' });
  await expect(panel).toBeVisible();
  return panel;
}

test.describe('conversación · panel lateral del detalle del viaje', () => {
  test('la conversación está visible al entrar, con el historial y el compositor', async ({
    page,
  }) => {
    await login(page);
    // viaje-1 arranca con una conversación ABIERTA, ATENDIDA y con historial.
    const panel = await irAlViaje(page, 'viaje-1');

    await expect(panel.getByRole('textbox', { name: 'Mensaje' })).toBeVisible();
    // Indicador atendido/resuelto visible (DEC-014).
    await expect(panel.getByText('Atendida')).toBeVisible();
    // La respuesta de AI27 se presenta con la etiqueta fija (DEC-021 #4).
    await expect(panel.getByText('AI27 Operations').first()).toBeVisible();
  });

  test('envía un mensaje y lo ve en la lista una sola vez', async ({ page }) => {
    await login(page);
    const panel = await irAlViaje(page, 'viaje-1');

    const texto = 'Confirmo la nueva ventana de entrega.';
    await panel.getByRole('textbox', { name: 'Mensaje' }).fill(texto);
    await panel.getByRole('button', { name: 'Enviar mensaje' }).click();

    await expect(panel.getByText(texto)).toBeVisible();
    // Tras enviarse, el campo se limpia y el texto no se duplica.
    await expect(panel.getByRole('textbox', { name: 'Mensaje' })).toHaveValue('');
    await expect(panel.getByText(texto)).toHaveCount(1);
  });

  test('carga solo la conversación del viaje que se ve', async ({ page }) => {
    const pedidas: string[] = [];
    page.on('request', (peticion) => {
      const ruta = new URL(peticion.url()).pathname;
      if (/\/conversacion(\/|$)/.test(ruta)) pedidas.push(ruta);
    });
    await login(page);
    const panel = await irAlViaje(page, 'viaje-1');
    await expect(panel.getByText('AI27 Operations').first()).toBeVisible();

    expect(pedidas.length).toBeGreaterThan(0);
    expect(pedidas.every((ruta) => ruta.includes('/viajes/viaje-1/conversacion'))).toBe(true);
  });

  test('es una columna fija a la derecha que ocupa todo el alto de la pantalla', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    const panel = await irAlViaje(page, 'viaje-1');

    const caja = (await panel.boundingBox())!;
    const contenido = (await page.getByRole('main').boundingBox())!;
    expect(caja.y).toBe(0);
    expect(caja.height).toBe(900);
    expect(Math.round(caja.x + caja.width)).toBe(1440);
    expect(caja.x).toBeGreaterThanOrEqual(contenido.x + contenido.width - 1);

    await page.mouse.wheel(0, 2000);
    const despues = (await panel.boundingBox())!;
    expect(despues.y).toBe(0);
    expect(despues.height).toBe(900);
  });

  test('con el panel abierto, Seguimiento y Acciones siguen lado a lado si caben', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await irAlViaje(page, 'viaje-1');

    const seguimiento = (await page.getByRole('region', { name: 'Seguimiento' }).boundingBox())!;
    const acciones = (await page.getByRole('region', { name: 'Acciones' }).boundingBox())!;
    expect(acciones.x).toBeGreaterThanOrEqual(seguimiento.x + seguimiento.width - 1);
    expect(Math.abs(acciones.y - seguimiento.y)).toBeLessThan(2);
  });

  test('arranca expandido, y el encabezado de la página no trae botón de ocultar o mostrar', async ({
    page,
  }) => {
    await login(page);
    const panel = await irAlViaje(page, 'viaje-1');

    await expect(panel.getByRole('textbox', { name: 'Mensaje' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Contraer conversación' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(page.getByRole('button', { name: /ocultar|mostrar/i })).toHaveCount(0);
  });

  test('contraer deja una franja angosta con el icono de mensaje; el icono la expande', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    const panel = await irAlViaje(page, 'viaje-1');

    await panel.getByRole('button', { name: 'Contraer conversación' }).click();

    await expect(panel.getByRole('textbox', { name: 'Mensaje' })).toHaveCount(0);
    await expect(panel.getByRole('heading')).toHaveCount(0);
    await expect.poll(async () => (await panel.boundingBox())!.width).toBeLessThanOrEqual(80);
    const franja = (await panel.boundingBox())!;
    expect(franja.y).toBe(0);
    expect(franja.height).toBe(900);
    expect(Math.round(franja.x + franja.width)).toBe(1440);

    const expandir = panel.getByRole('button', { name: 'Expandir conversación' });
    await expect(expandir).toHaveAttribute('aria-expanded', 'false');
    await expandir.click();

    await expect(panel.getByRole('textbox', { name: 'Mensaje' })).toBeVisible();
    await expect(panel.getByText('AI27 Operations').first()).toBeVisible();
    await expect.poll(async () => (await panel.boundingBox())!.width).toBeGreaterThan(300);
  });

  test('al contraerlo, la página recupera el ancho del panel', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    const panel = await irAlViaje(page, 'viaje-1');
    const seguimiento = page.getByRole('region', { name: 'Seguimiento' });

    const expandido = (await seguimiento.boundingBox())!.width;
    await panel.getByRole('button', { name: 'Contraer conversación' }).click();

    await expect
      .poll(async () => (await seguimiento.boundingBox())!.width)
      .toBeGreaterThan(expandido + 150);
  });

  test('al volver a expandirlo conserva la historia ya cargada', async ({ page }) => {
    await login(page);
    const panel = await irAlViaje(page, 'viaje-1');
    await expect(panel.getByText('AI27 Operations').first()).toBeVisible();

    await panel.getByRole('button', { name: 'Contraer conversación' }).click();
    await panel.getByRole('button', { name: 'Expandir conversación' }).click();

    await expect(panel.getByText('AI27 Operations').first()).toBeVisible();
  });

  test('en pantallas angostas el panel expandido se superpone y la franja no tapa la página', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await login(page);
    const panel = await irAlViaje(page, 'viaje-1');

    const caja = (await panel.boundingBox())!;
    expect(caja.y).toBe(0);
    expect(caja.height).toBe(900);
    expect(Math.round(caja.x + caja.width)).toBe(800);

    // Seguimiento y Acciones.
    const seguimiento = (await page.getByRole('region', { name: 'Seguimiento' }).boundingBox())!;
    const acciones = (await page.getByRole('region', { name: 'Acciones' }).boundingBox())!;
    expect(acciones.y).toBeGreaterThan(seguimiento.y);

    await panel.getByRole('button', { name: 'Contraer conversación' }).click();
    await expect.poll(async () => (await panel.boundingBox())!.width).toBeLessThanOrEqual(80);
    const franja = (await panel.boundingBox())!;
    const contenido = (await page.getByRole('main').boundingBox())!;
    expect(contenido.x + contenido.width).toBeLessThanOrEqual(franja.x + 1);
  });

  test('no tapa los botones de las otras columnas', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/viaje-1');
    await expect(page.getByRole('complementary', { name: 'Conversación' })).toBeVisible();
    // El botón de emergencia se puede pulsar.
    await page.getByRole('button', { name: 'Activar emergencia' }).click();
    await expect(page.getByRole('button', { name: 'Activar ahora' })).toBeVisible();
  });

  test('una conversación en solo lectura bloquea el envío y explica la razón', async ({ page }) => {
    await login(page);
    // viaje-6 arranca con una conversación en SOLO LECTURA (viaje cerrado).
    const panel = await irAlViaje(page, 'viaje-6');

    await expect(panel.getByText(/solo lectura: la ventana para escribir se cerró/i)).toBeVisible();
    await expect(panel.getByRole('textbox', { name: 'Mensaje' })).toBeDisabled();
    await expect(panel.getByRole('button', { name: 'Enviar mensaje' })).toBeDisabled();
  });

  test('un viaje sin conversación lo avisa y no deja escribir', async ({ page }) => {
    await login(page);
    const panel = await irAlViaje(page, 'viaje-3');

    await expect(panel.getByText('Este viaje todavía no tiene una conversación.')).toBeVisible();
    await expect(panel.getByRole('textbox', { name: 'Mensaje' })).toBeDisabled();
  });
});

test.describe('conversación · solo en el detalle del viaje', () => {
  test('el historial y la solicitud no tienen conversación ni muelle', async ({ page }) => {
    await login(page);
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Muelle de mensajería' })).toHaveCount(0);
    await expect(page.getByRole('complementary', { name: 'Conversación' })).toHaveCount(0);

    await page.goto('/viajes/new');
    await expect(page.getByRole('heading', { name: 'Solicitar nuevo servicio' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Conversación' })).toHaveCount(0);
  });

  test('no hay muelle, barra "Mensajería" ni lista de conversaciones en el detalle', async ({
    page,
  }) => {
    await login(page);
    await irAlViaje(page, 'viaje-1');
    await expect(page.getByRole('region', { name: 'Muelle de mensajería' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Lista de conversaciones' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Minimizar' })).toHaveCount(0);
  });

  test('al salir del detalle la conversación desaparece', async ({ page }) => {
    await login(page);
    await irAlViaje(page, 'viaje-1');

    await page.getByRole('link', { name: 'Historial de Viajes', exact: true }).first().click();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Conversación' })).toHaveCount(0);
  });

  test('el detalle no tiene un botón ni enlace "Conversación" que lleve a otra pantalla', async ({
    page,
  }) => {
    await login(page);
    await irAlViaje(page, 'viaje-1');
    await expect(page.getByRole('button', { name: 'Conversación', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Conversación' })).toHaveCount(0);
  });

  test('la ruta /viajes/$viajeId/conversacion ya no existe', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/viaje-1/conversacion');
    await expect(page.getByText('Esta página no existe')).toBeVisible();
  });
});

test.describe('conversación · palabra larga sin espacios', () => {
  /**
   * Afirma que la burbuja que contiene el texto no desborda y que queda dentro de la columna.
   */
  async function sinDesborde(panel: Locator, texto: string): Promise<void> {
    const cuerpo = panel.getByText(texto).first();
    await expect(cuerpo).toBeVisible();
    const medidas = await cuerpo.evaluate((el) => {
      const burbuja = el.parentElement!;
      const caja = el.closest('aside')!.getBoundingClientRect();
      return {
        scrollWidth: burbuja.scrollWidth,
        clientWidth: burbuja.clientWidth,
        derecha: burbuja.getBoundingClientRect().right,
        limitePanel: caja.right,
      };
    });
    expect(medidas.scrollWidth).toBeLessThanOrEqual(medidas.clientWidth + 1);
    expect(medidas.derecha).toBeLessThanOrEqual(medidas.limitePanel + 1);
  }

  test('la palabra larga que ya trae el mock se parte dentro de su burbuja', async ({ page }) => {
    await login(page);
    const panel = await irAlViaje(page, 'viaje-9');
    await sinDesborde(panel, 'asodhaskdgaskldhaksdhiasdh');
  });

  test('una palabra larga escrita y enviada tampoco se sale de la burbuja', async ({ page }) => {
    await login(page);
    const panel = await irAlViaje(page, 'viaje-1');
    // 300 caracteres seguidos, sin un solo espacio ni guion.
    const larga = 'x'.repeat(300);
    await panel.getByRole('textbox', { name: 'Mensaje' }).fill(larga);
    await panel.getByRole('button', { name: 'Enviar mensaje' }).click();
    await sinDesborde(panel, larga);
  });

  test('en una pantalla angosta la palabra larga tampoco desborda', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await login(page);
    const panel = await irAlViaje(page, 'viaje-9');
    await sinDesborde(panel, 'asodhaskdgaskldhaksdhiasdh');
  });
});
