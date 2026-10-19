/*
 * Smoke tests. El harness, no la cobertura.
 *
 * Corren contra el bundle de produccion (`vite preview`) y sin backend: por eso solo
 * comprueban lo que no depende de la API — que la app arranca, que el login renderiza
 * y que la guarda de rutas privadas redirige.
 *
 * TODO: cuando exista un backend alcanzable o un mock, anadir el flujo de escritura
 * (solicitud de servicio) y el de degradacion (matar el stream y verificar que la app
 * pasa a polling y AVISA).
 */

import { expect, test } from '@playwright/test';

test('la pagina de login renderiza', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Iniciar sesion' })).toBeVisible();
  await expect(page.getByLabel('Correo electronico empresarial')).toBeVisible();
  await expect(page.getByLabel('Contrasena', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar sesion' })).toBeVisible();
});

test('una ruta privada redirige a login sin sesion', async ({ page }) => {
  await page.goto('/viajes');

  // La guarda corre en beforeLoad, antes de que el loader dispare su peticion.
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('button', { name: 'Iniciar sesion' })).toBeVisible();
});

test('la raiz redirige a login sin sesion', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});

// PRUEBA NEGATIVA DELIBERADA (E8-T1, tarea 5): error de tipos a proposito para
// confirmar que el job `calidad` del CI bloquea. Se revierte en el commit siguiente.
const _pruebaNegativaE8T1: number = 'esto no es un number';
