/*
 * Cancelar / rechazar el viaje, carril cliente, contra el `bff` simulado (E1-HU-002 /
 * E9-T7, AI27-26).
 *
 * Cubre el recorrido de la DEFINICIÓN DE TERMINADO: cancelar un viaje en SOLICITADO.
 * El mock imita las tres respuestas del carril (400 sin motivo, 409 fuera de ventana,
 * 200 con el ViajeSeguimiento actualizado) y aplica la transición sobre su estado en
 * memoria, así que tras confirmar la vista refleja el nuevo estado.
 */

import { expect, test } from '@playwright/test';
import { login } from './support/login';

test.describe('cancelar · carril cliente', () => {
  test('cancela un viaje en SOLICITADO: exige motivo y refleja el nuevo estado', async ({
    page,
  }) => {
    await login(page);
    // viaje-3 arranca en SOLICITADO en el mock: dentro de la ventana de cancelación.
    await page.goto('/viajes/viaje-3');

    const seccion = page.getByRole('heading', { name: 'Cancelar o rechazar', level: 2 });
    await expect(seccion).toBeVisible();

    // En SOLICITADO se ofrece cancelar; rechazar (solo asignado) NO se ofrece.
    await expect(page.getByRole('button', { name: 'Cancelar viaje' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rechazar servicio' })).toBeHidden();

    // Abrir el diálogo: el confirmar está inerte sin motivo (regla DEC-111).
    await page.getByRole('button', { name: 'Cancelar viaje' }).click();
    const confirmar = page.getByRole('button', { name: 'Confirmar cancelación' });
    await expect(confirmar).toBeDisabled();

    // Con motivo, se habilita y se confirma.
    await page.getByLabel('Motivo de la cancelación').fill('Cambié de planes, ya no lo necesito.');
    await expect(confirmar).toBeEnabled();
    await confirmar.click();

    // Tras el 200, la vista refresca con el estado nuevo (sin un segundo GET): la
    // sección de cancelar deja de ofrecer botones y explica que el viaje ya finalizó.
    // (El estado «Cancelado» aparece tanto en el chip del encabezado como en el hito.)
    await expect(page.getByText(/ya finalizó/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancelar viaje' })).toBeHidden();
    await expect(page.getByText('Cancelado').first()).toBeVisible();
  });
});
