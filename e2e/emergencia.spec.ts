/*
 * Emergencia del cliente, contra el `bff` simulado (E9-T9, AI27-28).
 *
 * Cubre el recorrido de la DEFINICIÓN DE TERMINADO del ticket:
 *   - activar una emergencia (crea y envía de inmediato, sin exigir nota previa);
 *   - agregar una nota a un caso existente;
 *   - que la vista del cliente no exponga datos internos (notas, responsable, Reacción).
 *
 * El mock imita la proyección por audiencia del `bff`: el cliente solo ve el caso por
 * fecha/hora + estado. El estado del mock vive en memoria por carga de página, así que
 * cada test estrena su propio estado (un `goto` recarga la app).
 */

import { expect, test } from '@playwright/test';
import { login } from './support/login';

test.describe('emergencia · activación y notas', () => {
  test('un viaje sin emergencias permite activar una, y el caso aparece en la lista', async ({
    page,
  }) => {
    await login(page);
    // viaje-1 arranca SIN emergencias en el mock.
    await page.goto('/viajes/viaje-1');

    const panel = page.getByRole('heading', { name: 'Emergencia' });
    await expect(panel).toBeVisible();
    await expect(page.getByText('Sin emergencias en este viaje.')).toBeVisible();

    // Activar abre la confirmación; confirmar crea el caso de inmediato (sin nota).
    await page.getByRole('button', { name: 'Activar emergencia' }).click();
    await page.getByRole('button', { name: 'Activar ahora' }).click();

    // El caso aparece y el agregado pasa a "activa". Identificado por fecha/hora + estado.
    await expect(
      page.getByRole('alert').filter({ hasText: 'Hay una emergencia activa en este viaje.' }),
    ).toBeVisible();
    await expect(
      page.getByText('Hay una emergencia activa en este viaje.', { exact: true }).last(),
    ).toBeVisible();
    await expect(page.getByRole('region', { name: 'Casos' })).toContainText('En atención');
    await expect(page.getByText('Sin emergencias en este viaje.')).toBeHidden();
  });

  test('"Activar emergencia" ocupa todo el ancho de la tarjeta, entre el divisor y el registro', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/viajes/viaje-1');
    const boton = page.getByRole('button', { name: 'Activar emergencia' });
    await expect(boton).toBeVisible();
    // La tarjeta de Emergencia es la que contiene el botón; su cuerpo mide su ancho menos el relleno.
    const medidas = await boton.evaluate((el) => {
      const cuerpo = el.parentElement!.parentElement!;
      const estilo = getComputedStyle(cuerpo);
      const util =
        cuerpo.getBoundingClientRect().width -
        parseFloat(estilo.paddingLeft) -
        parseFloat(estilo.paddingRight);
      return { boton: el.getBoundingClientRect().width, util };
    });
    expect(Math.abs(medidas.boton - medidas.util)).toBeLessThan(2);
  });

  test('fuera del recorrido el botón se ve deshabilitado, y con un caso activo también', async ({
    page,
  }) => {
    await login(page);
    // viaje-3 está SOLICITADO: no se puede activar, pero el botón sigue ahí.
    await page.goto('/viajes/viaje-3');
    await expect(page.getByRole('button', { name: 'Activar emergencia' })).toBeDisabled();

    // viaje-1 está en tránsito: se habilita; al activarla, queda deshabilitado hasta que se resuelva.
    await page.goto('/viajes/viaje-1');
    const boton = page.getByRole('button', { name: 'Activar emergencia' });
    await expect(boton).toBeEnabled();
    await boton.click();
    await page.getByRole('button', { name: 'Activar ahora' }).click();
    await expect(page.getByRole('region', { name: 'Casos' })).toBeVisible();
    await expect(boton).toBeDisabled();
  });

  test('agrega una nota a un caso existente; una nota vacía no se puede enviar', async ({
    page,
  }) => {
    await login(page);
    // viaje-2 arranca CON un caso en atención (seed del mock).
    await page.goto('/viajes/viaje-2');

    await expect(
      page.getByText('Hay una emergencia activa en este viaje.', { exact: true }).last(),
    ).toBeVisible();

    const agregar = page.getByRole('button', { name: 'Agregar nota' });
    // Sin texto: deshabilitado.
    await expect(agregar).toBeDisabled();

    await page.getByLabel('Nota de emergencia').fill('La unidad quedó detenida en el km 42.');
    await expect(agregar).toBeEnabled();
    await agregar.click();

    // Tras enviarse, el textarea se limpia (la nota se fue) y el botón vuelve a inerte.
    await expect(page.getByLabel('Nota de emergencia')).toHaveValue('');
    await expect(agregar).toBeDisabled();
  });

  test('la vista del cliente no muestra datos internos del caso', async ({ page }) => {
    await login(page);
    await page.goto('/viajes/viaje-2');

    await expect(page.getByRole('region', { name: 'Casos' })).toBeVisible();

    // El cliente nunca ve vocabulario interno: responsable, Reacción, recursos, ni el
    // id técnico del caso. Solo fecha/hora + estado curado.
    const cuerpo = page.getByRole('main');
    await expect(cuerpo).not.toContainText('Reacción');
    await expect(cuerpo).not.toContainText('Responsable');
    await expect(cuerpo).not.toContainText('emg-seed-1');
  });
});
